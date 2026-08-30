import {
  AppointmentStatuses,
  BusinessStatuses,
  type AppointmentStatus,
} from "../../core/constants/statuses.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import { ValidationError } from "../../core/errors/app-error.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BranchRepository } from "../business-management/branch.repository.interface.ts";
import type { BusinessRepository } from "../business-management/business.repository.interface.ts";
import type { MembershipRepository } from "../business-management/membership.repository.interface.ts";
import type { ScheduleRepository } from "../business-management/schedule.repository.interface.ts";
import type { ServiceRepository } from "../catalog/service.repository.interface.ts";
import type { VehicleRepository } from "../vehicles/vehicle.repository.interface.ts";
import type {
  AppointmentResponseDto,
  AppointmentSlotsResponseDto,
  CreateAppointmentRequestDto,
  TransitionRequestDto,
} from "./appointment.dto.ts";
import {
  AppointmentAccessDeniedError,
  AppointmentCancellationNoticeError,
  AppointmentConflictError,
  AppointmentNoticeError,
  AppointmentNotFoundError,
  AppointmentOutsideHoursError,
  AppointmentsDisabledError,
} from "./appointment.errors.ts";
import { AppointmentMapper } from "./appointment.mapper.ts";
import type { AppointmentRepository } from "./appointment.repository.interface.ts";
import {
  generateCandidateSlots,
  isIntervalWithinOpenHours,
} from "./appointment.schedule.ts";
import { assertTransition } from "./appointment.transitions.ts";
import type { AppointmentRecord } from "./appointment.types.ts";

type ActorContext = {
  userId: string;
  roles?: string[];
  globalPermissions?: string[];
};

export class AppointmentService {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly branchRepository: BranchRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  private async safeNotify(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.businessRepository.insertNotification({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: "appointment",
        entityId: input.entityId,
        metadata: input.metadata ?? {},
      });
    } catch {
      // Notifications must not roll back appointment mutations.
    }
  }

  private async notifyBusinessStaff(
    businessId: string,
    input: {
      type: string;
      title: string;
      body: string;
      entityId: string;
      excludeUserId?: string;
    },
  ): Promise<void> {
    try {
      const members = await this.membershipRepository.listByBusiness(businessId);
      for (const m of members) {
        if (m.status !== "active") continue;
        if (input.excludeUserId && m.userId === input.excludeUserId) continue;
        if (m.role !== "owner" && m.role !== "manager") continue;
        await this.safeNotify({
          userId: m.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          entityId: input.entityId,
        });
      }
    } catch {
      // best-effort
    }
  }

  private async loadAccessible(
    actor: ActorContext,
    appointmentId: string,
    options?: { includeHistory?: boolean },
  ): Promise<AppointmentRecord> {
    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      options,
    );
    if (!appointment) throw new AppointmentNotFoundError(appointmentId);

    if (appointment.customerId === actor.userId) return appointment;

    const membership = await this.businessRepository.findActiveMembership(
      appointment.businessId,
      actor.userId,
    );
    if (membership) return appointment;

    const roles = actor.roles ?? [];
    if (roles.includes("admin") || roles.includes("super_admin")) {
      return appointment;
    }

    throw new AppointmentAccessDeniedError();
  }

  async listForActor(
    actor: ActorContext,
    filters: {
      status?: AppointmentStatus | AppointmentStatus[];
      from?: string;
      to?: string;
      businessId?: string;
    },
  ): Promise<AppointmentResponseDto[]> {
    const rows = await this.appointmentRepository.list({
      customerId: actor.userId,
      businessId: filters.businessId,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    });
    return rows.map((r) => AppointmentMapper.toDto(r));
  }

  async listForBusiness(
    businessId: string,
    filters: {
      status?: AppointmentStatus | AppointmentStatus[];
      from?: string;
      to?: string;
      branchId?: string;
    },
  ): Promise<AppointmentResponseDto[]> {
    const rows = await this.appointmentRepository.list({
      businessId,
      branchId: filters.branchId,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    });
    return rows.map((r) => AppointmentMapper.toDto(r));
  }

  async getById(
    actor: ActorContext,
    appointmentId: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.loadAccessible(actor, appointmentId, {
      includeHistory: true,
    });
    return AppointmentMapper.toDto(appointment, { includeHistory: true });
  }

  private async assertBookableContext(input: {
    businessId: string;
    branchId: string;
    serviceId: string;
    vehicleId?: string | null;
    customerId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
  }) {
    const business = await this.businessRepository.findById(
      input.businessId,
      "admin",
    );
    if (!business || business.status !== BusinessStatuses.Active) {
      throw new ValidationError("Business is not available for booking.");
    }

    const settings = await this.businessRepository.findSettings(
      input.businessId,
      "admin",
    );
    if (!settings?.appointmentsEnabled) throw new AppointmentsDisabledError();

    const branch = await this.branchRepository.findById(
      input.businessId,
      input.branchId,
    );
    if (!branch || !branch.isActive) {
      throw new ValidationError("Branch is not available for booking.");
    }

    const service = await this.serviceRepository.findById(
      input.businessId,
      input.serviceId,
    );
    if (!service || !service.isActive) {
      throw new ValidationError("Service is not available for booking.");
    }

    if (input.vehicleId) {
      const vehicle = await this.vehicleRepository.findById(input.vehicleId);
      if (!vehicle || vehicle.customerId !== input.customerId || !vehicle.isActive) {
        throw new ValidationError("Vehicle must belong to the customer.");
      }
    }

    const now = new Date();
    if (input.scheduledStart <= now) {
      throw new AppointmentNoticeError("Appointment start must be in the future.");
    }

    const noticeMinutes = settings.minimumBookingNoticeMinutes ?? 0;
    if (
      input.scheduledStart.getTime() < now.getTime() + noticeMinutes * 60_000
    ) {
      throw new AppointmentNoticeError(
        `Appointments require at least ${noticeMinutes} minutes notice.`,
      );
    }

    const maxDays = settings.maximumBookingDaysAhead ?? 90;
    const maxMs = maxDays * 24 * 60 * 60_000;
    if (input.scheduledStart.getTime() > now.getTime() + maxMs) {
      throw new AppointmentNoticeError(
        `Appointments cannot be booked more than ${maxDays} days ahead.`,
      );
    }

    const [openingHours, closureDates] = await Promise.all([
      this.scheduleRepository.listOpeningHours(input.businessId),
      this.scheduleRepository.listClosureDates(input.businessId),
    ]);

    const withinHours = isIntervalWithinOpenHours(
      input.branchId,
      input.scheduledStart,
      input.scheduledEnd,
      openingHours,
      closureDates,
    );
    if (!withinHours) throw new AppointmentOutsideHoursError();

    const overlaps = await this.appointmentRepository.listOverlapping({
      branchId: input.branchId,
      scheduledStart: input.scheduledStart.toISOString(),
      scheduledEnd: input.scheduledEnd.toISOString(),
    });
    if (overlaps.length > 0) throw new AppointmentConflictError();

    return { business, settings, service };
  }

  async create(
    actor: ActorContext,
    input: CreateAppointmentRequestDto,
    requestId?: string,
  ): Promise<AppointmentResponseDto> {
    const settingsPreview = await this.businessRepository.findSettings(
      input.businessId,
      "admin",
    );
    const service = await this.serviceRepository.findById(
      input.businessId,
      input.serviceId,
    );
    if (!service || !service.isActive) {
      throw new ValidationError("Service is not available for booking.");
    }

    const duration =
      service.estimatedDurationMinutes ??
        settingsPreview?.defaultAppointmentDurationMinutes ??
        60;
    if (duration <= 0) {
      throw new ValidationError("Service duration is invalid.");
    }

    const scheduledStart = new Date(input.scheduledStart);
    const scheduledEnd = new Date(
      scheduledStart.getTime() + duration * 60_000,
    );

    const { settings } = await this.assertBookableContext({
      businessId: input.businessId,
      branchId: input.branchId,
      serviceId: input.serviceId,
      vehicleId: input.vehicleId,
      customerId: actor.userId,
      scheduledStart,
      scheduledEnd,
    });

    const initialStatus = settings.autoConfirmAppointments
      ? AppointmentStatuses.Confirmed
      : AppointmentStatuses.Requested;

    const appointment = await this.appointmentRepository.create({
      customerId: actor.userId,
      businessId: input.businessId,
      branchId: input.branchId,
      vehicleId: input.vehicleId ?? null,
      status: initialStatus,
      scheduledStart: scheduledStart.toISOString(),
      scheduledEnd: scheduledEnd.toISOString(),
      customerNotes: input.customerNotes ?? null,
      services: [{
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        estimatedDurationMinutes: duration,
        quotedPrice: service.price,
      }],
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "appointment.created",
      entityType: "appointment",
      entityId: appointment.id,
      requestId,
      newValues: { status: initialStatus, businessId: input.businessId },
    });

    await this.safeNotify({
      userId: actor.userId,
      type: initialStatus === AppointmentStatuses.Confirmed
        ? "appointment_confirmed"
        : "appointment_requested",
      title: initialStatus === AppointmentStatuses.Confirmed
        ? "Appointment confirmed"
        : "Appointment requested",
      body: initialStatus === AppointmentStatuses.Confirmed
        ? "Your appointment has been confirmed."
        : "Your appointment request was submitted.",
      entityId: appointment.id,
    });

    await this.notifyBusinessStaff(input.businessId, {
      type: "appointment_requested",
      title: "New appointment request",
      body: "A customer requested an appointment.",
      entityId: appointment.id,
      excludeUserId: actor.userId,
    });

    return AppointmentMapper.toDto(appointment);
  }

  async listSlots(
    businessId: string,
    branchId: string,
    date: string,
    serviceId?: string,
  ): Promise<AppointmentSlotsResponseDto> {
    const business = await this.businessRepository.findById(businessId, "admin");
    if (!business || business.status !== BusinessStatuses.Active) {
      throw new ValidationError("Business is not available for booking.");
    }
    const settings = await this.businessRepository.findSettings(businessId, "admin");
    if (!settings?.appointmentsEnabled) throw new AppointmentsDisabledError();

    const branch = await this.branchRepository.findById(businessId, branchId);
    if (!branch || !branch.isActive) {
      throw new ValidationError("Branch is not available for booking.");
    }

    let duration = settings.defaultAppointmentDurationMinutes ?? 60;
    if (serviceId) {
      const service = await this.serviceRepository.findById(businessId, serviceId);
      if (!service || !service.isActive) {
        throw new ValidationError("Service is not available for booking.");
      }
      duration = service.estimatedDurationMinutes ?? duration;
    }

    const dayStart = new Date(`${date}T00:00:00+03:00`).toISOString();
    const dayEnd = new Date(`${date}T23:59:59+03:00`).toISOString();
    const occupiedRows = await this.appointmentRepository.list({
      businessId,
      branchId,
      from: dayStart,
      to: dayEnd,
    });
    const occupied = occupiedRows
      .filter((a) =>
        a.status !== AppointmentStatuses.Rejected &&
        a.status !== AppointmentStatuses.CancelledByCustomer &&
        a.status !== AppointmentStatuses.CancelledByBusiness &&
        a.status !== AppointmentStatuses.Completed &&
        a.status !== AppointmentStatuses.Expired &&
        a.status !== AppointmentStatuses.NoShow
      )
      .map((a) => ({ start: a.scheduledStart, end: a.scheduledEnd }));

    const [openingHours, closureDates] = await Promise.all([
      this.scheduleRepository.listOpeningHours(businessId),
      this.scheduleRepository.listClosureDates(businessId),
    ]);

    const slots = generateCandidateSlots({
      dateStr: date,
      branchId,
      durationMinutes: duration,
      openingHours,
      closureDates,
      occupied,
      minimumNoticeMinutes: settings.minimumBookingNoticeMinutes ?? 0,
    });

    return { date, durationMinutes: duration, slots };
  }

  private async requireBusinessActor(
    actor: ActorContext,
    businessId: string,
  ): Promise<void> {
    const membership = await this.businessRepository.findActiveMembership(
      businessId,
      actor.userId,
    );
    if (membership) return;
    const perms = actor.globalPermissions ?? [];
    if (
      perms.includes(Permissions.Appointment.Manage) ||
      perms.includes(Permissions.Appointment.Confirm)
    ) {
      return;
    }
    throw new AppointmentAccessDeniedError(
      "Only business staff can perform this action.",
    );
  }

  private async transition(
    actor: ActorContext,
    appointmentId: string,
    toStatus: AppointmentStatus,
    body: TransitionRequestDto,
    options: {
      actorRole: "customer" | "business";
      auditAction: string;
      notifyType: string;
      notifyTitle: string;
      notifyBody: string;
      patch?: {
        confirmedAt?: string | null;
        arrivedAt?: string | null;
        startedAt?: string | null;
        completedAt?: string | null;
        cancelledBy?: string | null;
        businessNotes?: string | null;
      };
      enforceCancellationNotice?: boolean;
    },
    requestId?: string,
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.loadAccessible(actor, appointmentId);

    if (options.actorRole === "customer") {
      if (appointment.customerId !== actor.userId) {
        throw new AppointmentAccessDeniedError();
      }
    } else {
      await this.requireBusinessActor(actor, appointment.businessId);
    }

    assertTransition(appointment.status, toStatus);

    if (options.enforceCancellationNotice) {
      const settings = await this.businessRepository.findSettings(
        appointment.businessId,
        "admin",
      );
      const notice = settings?.cancellationNoticeMinutes ?? 0;
      const start = new Date(appointment.scheduledStart);
      if (start.getTime() - Date.now() < notice * 60_000) {
        throw new AppointmentCancellationNoticeError();
      }
    }

    const updated = await this.appointmentRepository.transition({
      appointmentId,
      fromStatus: appointment.status,
      toStatus,
      actorUserId: actor.userId,
      note: body.note ?? body.reason ?? null,
      cancellationReason: body.reason ?? body.note ?? null,
      patch: options.patch,
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: options.auditAction,
      entityType: "appointment",
      entityId: appointmentId,
      requestId,
      previousStatus: appointment.status,
      newStatus: toStatus,
    });

    await this.safeNotify({
      userId: appointment.customerId,
      type: options.notifyType,
      title: options.notifyTitle,
      body: options.notifyBody,
      entityId: appointmentId,
    });

    return AppointmentMapper.toDto(updated);
  }

  async confirm(
    actor: ActorContext,
    appointmentId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ) {
    return this.transition(
      actor,
      appointmentId,
      AppointmentStatuses.Confirmed,
      body,
      {
        actorRole: "business",
        auditAction: "appointment.confirmed",
        notifyType: "appointment_confirmed",
        notifyTitle: "Appointment confirmed",
        notifyBody: "Your appointment has been confirmed.",
        patch: { confirmedAt: new Date().toISOString() },
      },
      requestId,
    );
  }

  async reject(
    actor: ActorContext,
    appointmentId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ) {
    return this.transition(
      actor,
      appointmentId,
      AppointmentStatuses.Rejected,
      body,
      {
        actorRole: "business",
        auditAction: "appointment.rejected",
        notifyType: "appointment_rejected",
        notifyTitle: "Appointment rejected",
        notifyBody: "Your appointment request was rejected.",
      },
      requestId,
    );
  }

  async cancel(
    actor: ActorContext,
    appointmentId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ) {
    const appointment = await this.loadAccessible(actor, appointmentId);
    const isCustomer = appointment.customerId === actor.userId;
    const membership = await this.businessRepository.findActiveMembership(
      appointment.businessId,
      actor.userId,
    );

    if (!isCustomer && !membership) {
      throw new AppointmentAccessDeniedError();
    }

    const finalStatus = isCustomer
      ? AppointmentStatuses.CancelledByCustomer
      : AppointmentStatuses.CancelledByBusiness;

    return this.transition(
      actor,
      appointmentId,
      finalStatus,
      body,
      {
        actorRole: isCustomer ? "customer" : "business",
        auditAction: "appointment.cancelled",
        notifyType: "appointment_cancelled",
        notifyTitle: "Appointment cancelled",
        notifyBody: "An appointment was cancelled.",
        enforceCancellationNotice: true,
        patch: {
          cancelledBy: actor.userId,
        },
      },
      requestId,
    );
  }

  async arrive(
    actor: ActorContext,
    appointmentId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ) {
    return this.transition(
      actor,
      appointmentId,
      AppointmentStatuses.CustomerArrived,
      body,
      {
        actorRole: "business",
        auditAction: "appointment.customer_arrived",
        notifyType: "appointment_customer_arrived",
        notifyTitle: "Customer arrived",
        notifyBody: "The business marked you as arrived.",
        patch: { arrivedAt: new Date().toISOString() },
      },
      requestId,
    );
  }

  async start(
    actor: ActorContext,
    appointmentId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ) {
    return this.transition(
      actor,
      appointmentId,
      AppointmentStatuses.InProgress,
      body,
      {
        actorRole: "business",
        auditAction: "appointment.started",
        notifyType: "appointment_started",
        notifyTitle: "Appointment started",
        notifyBody: "Your appointment is now in progress.",
        patch: { startedAt: new Date().toISOString() },
      },
      requestId,
    );
  }

  async complete(
    actor: ActorContext,
    appointmentId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ) {
    return this.transition(
      actor,
      appointmentId,
      AppointmentStatuses.Completed,
      body,
      {
        actorRole: "business",
        auditAction: "appointment.completed",
        notifyType: "appointment_completed",
        notifyTitle: "Appointment completed",
        notifyBody: "Your appointment has been completed.",
        patch: { completedAt: new Date().toISOString() },
      },
      requestId,
    );
  }

  async noShow(
    actor: ActorContext,
    appointmentId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ) {
    return this.transition(
      actor,
      appointmentId,
      AppointmentStatuses.NoShow,
      body,
      {
        actorRole: "business",
        auditAction: "appointment.no_show",
        notifyType: "appointment_no_show",
        notifyTitle: "Marked as no-show",
        notifyBody: "Your appointment was marked as no-show.",
      },
      requestId,
    );
  }
}
