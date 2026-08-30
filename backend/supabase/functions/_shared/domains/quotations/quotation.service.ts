import {
  BusinessStatuses,
  QuotationItemTypes,
  QuotationStatuses,
  type QuotationStatus,
} from "../../core/constants/statuses.ts";
import { ValidationError } from "../../core/errors/app-error.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BranchRepository } from "../business-management/branch.repository.interface.ts";
import type { BusinessRepository } from "../business-management/business.repository.interface.ts";
import type { MembershipRepository } from "../business-management/membership.repository.interface.ts";
import type { ProductRepository } from "../catalog/product.repository.interface.ts";
import type { ServiceRepository } from "../catalog/service.repository.interface.ts";
import type { VehicleRepository } from "../vehicles/vehicle.repository.interface.ts";
import type { AppointmentRepository } from "../appointments/appointment.repository.interface.ts";
import type {
  QuotationItemInputDto,
  QuotationResponseDto,
  TransitionRequestDto,
} from "./quotation.dto.ts";
import type {
  CreateQuotationRequestDto,
  UpdateQuotationRequestDto,
} from "./quotation.schemas.ts";
import {
  QuotationAccessDeniedError,
  QuotationAlreadyAcceptedError,
  QuotationExpiredError,
  QuotationItemInvalidError,
  QuotationNotEditableError,
  QuotationNotFoundError,
  QuotationRevisionConflictError,
  QuotationsDisabledError,
} from "./quotation.errors.ts";
import {
  calculateLine,
  calculateTotals,
  formatMoney,
  formatQuantity,
} from "./quotation.money.ts";
import { QuotationMapper } from "./quotation.mapper.ts";
import type { QuotationRepository } from "./quotation.repository.interface.ts";
import {
  assertTransition,
  isExpired,
  REVISABLE_STATUSES,
} from "./quotation.transitions.ts";
import type {
  QuotationItemPersistenceInput,
  QuotationRecord,
} from "./quotation.types.ts";

type ActorContext = {
  userId: string;
  roles?: string[];
  globalPermissions?: string[];
};

export class QuotationService {
  constructor(
    private readonly quotationRepository: QuotationRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly branchRepository: BranchRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly productRepository: ProductRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly appointmentRepository: AppointmentRepository,
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
        entityType: "quotation",
        entityId: input.entityId,
        metadata: input.metadata ?? {},
      });
    } catch {
      // Notifications must not roll back quotation mutations.
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

  private isBusinessViewer(actor: ActorContext, quotation: QuotationRecord): boolean {
    if (quotation.customerId === actor.userId) return false;
    const roles = actor.roles ?? [];
    return roles.includes("admin") || roles.includes("super_admin");
  }

  private toAudienceDto(
    record: QuotationRecord,
    actor: ActorContext,
    options?: { includeHistory?: boolean },
  ): QuotationResponseDto {
    const includeBusinessNotes = record.customerId !== actor.userId ||
      this.isBusinessViewer(actor, record);
    return QuotationMapper.toDto(record, {
      includeBusinessNotes,
      includeHistory: options?.includeHistory,
    });
  }

  private async loadAccessible(
    actor: ActorContext,
    quotationId: string,
    options?: { includeHistory?: boolean },
  ): Promise<QuotationRecord> {
    const quotation = await this.quotationRepository.findById(quotationId, {
      includeItems: true,
      includeHistory: options?.includeHistory,
    });
    if (!quotation) throw new QuotationNotFoundError(quotationId);

    if (quotation.customerId === actor.userId) return quotation;

    const membership = await this.businessRepository.findActiveMembership(
      quotation.businessId,
      actor.userId,
    );
    if (membership) return quotation;

    const roles = actor.roles ?? [];
    if (roles.includes("admin") || roles.includes("super_admin")) {
      return quotation;
    }

    throw new QuotationAccessDeniedError();
  }

  private async assertQuotationsEnabled(businessId: string): Promise<void> {
    const settings = await this.businessRepository.findSettings(
      businessId,
      "admin",
    );
    if (!settings?.quotationsEnabled) throw new QuotationsDisabledError();
  }

  private async assertActiveBusinessContext(
    businessId: string,
    branchId: string,
  ): Promise<void> {
    const business = await this.businessRepository.findById(businessId, "admin");
    if (!business || business.status !== BusinessStatuses.Active) {
      throw new ValidationError("Business is not available.");
    }

    const branch = await this.branchRepository.findById(businessId, branchId);
    if (!branch || !branch.isActive) {
      throw new ValidationError("Branch is not available.");
    }
  }

  private async resolveItems(
    businessId: string,
    items: QuotationItemInputDto[],
  ): Promise<QuotationItemPersistenceInput[]> {
    const resolved: QuotationItemPersistenceInput[] = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index]!;
      const line = calculateLine({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxAmount: item.taxAmount,
      });

      let serviceId: string | null = item.serviceId ?? null;
      let productId: string | null = item.productId ?? null;
      let serviceNameSnapshot: string | null = null;
      let productNameSnapshot: string | null = null;
      let skuSnapshot: string | null = null;

      if (item.itemType === QuotationItemTypes.Service) {
        if (!serviceId) {
          throw new QuotationItemInvalidError("Service items require serviceId.");
        }
        const service = await this.serviceRepository.findById(
          businessId,
          serviceId,
        );
        if (!service || !service.isActive) {
          throw new QuotationItemInvalidError("Linked service is not available.");
        }
        serviceNameSnapshot = service.name;
      } else if (item.itemType === QuotationItemTypes.Product) {
        if (!productId) {
          throw new QuotationItemInvalidError("Product items require productId.");
        }
        const product = await this.productRepository.findById(
          businessId,
          productId,
        );
        if (!product || !product.isActive) {
          throw new QuotationItemInvalidError("Linked product is not available.");
        }
        productNameSnapshot = product.name;
        skuSnapshot = product.sku;
      } else {
        serviceId = null;
        productId = null;
      }

      resolved.push({
        itemType: item.itemType,
        serviceId,
        productId,
        description: item.description,
        quantity: formatQuantity(line.quantityMilli),
        unitPrice: formatMoney(line.unitPriceFils),
        discountAmount: formatMoney(line.discountFils),
        taxAmount: formatMoney(line.taxFils),
        lineTotal: formatMoney(line.lineTotalFils),
        serviceNameSnapshot,
        productNameSnapshot,
        skuSnapshot,
        sortOrder: item.sortOrder ?? index,
      });
    }

    return resolved;
  }

  private buildTotals(items: QuotationItemPersistenceInput[]) {
    const lines = items.map((item) => {
      const line = calculateLine({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxAmount: item.taxAmount,
      });
      return line;
    });
    const totals = calculateTotals(lines);
    return {
      items,
      subtotal: formatMoney(totals.subtotalFils),
      discountTotal: formatMoney(totals.discountTotalFils),
      taxTotal: formatMoney(totals.taxTotalFils),
      grandTotal: formatMoney(totals.grandTotalFils),
    };
  }

  private async validateLinks(input: {
    businessId: string;
    branchId: string;
    customerId: string;
    vehicleId?: string | null;
    appointmentId?: string | null;
  }): Promise<void> {
    if (input.appointmentId) {
      const appointment = await this.appointmentRepository.findById(
        input.appointmentId,
      );
      if (!appointment) {
        throw new ValidationError("Linked appointment was not found.");
      }
      if (
        appointment.customerId !== input.customerId ||
        appointment.businessId !== input.businessId ||
        appointment.branchId !== input.branchId
      ) {
        throw new ValidationError(
          "Appointment must match quotation customer, business, and branch.",
        );
      }
    }

    if (input.vehicleId) {
      const vehicle = await this.vehicleRepository.findById(input.vehicleId);
      if (!vehicle || vehicle.customerId !== input.customerId || !vehicle.isActive) {
        throw new ValidationError("Vehicle must belong to the customer.");
      }
    }
  }

  private async maybeExpire(
    actor: ActorContext,
    quotation: QuotationRecord,
    requestId?: string,
  ): Promise<QuotationRecord> {
    if (
      quotation.status !== QuotationStatuses.Issued &&
      quotation.status !== QuotationStatuses.Viewed
    ) {
      return quotation;
    }

    if (!isExpired(quotation.status, quotation.validUntil)) {
      return quotation;
    }

    const updated = await this.quotationRepository.transition({
      quotationId: quotation.id,
      fromStatus: quotation.status,
      toStatus: QuotationStatuses.Expired,
      actorUserId: actor.userId,
      note: "expired",
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "quotation.expired",
      entityType: "quotation",
      entityId: quotation.id,
      requestId,
      previousStatus: quotation.status,
      newStatus: QuotationStatuses.Expired,
    });

    await this.safeNotify({
      userId: quotation.customerId,
      type: "quotation_expired",
      title: "Quotation expired",
      body: "Your quotation has expired.",
      entityId: quotation.id,
    });

    await this.notifyBusinessStaff(quotation.businessId, {
      type: "quotation_expired",
      title: "Quotation expired",
      body: "A quotation has expired.",
      entityId: quotation.id,
    });

    return updated;
  }

  async listForActor(
    actor: ActorContext,
    filters: {
      status?: QuotationStatus | QuotationStatus[];
      from?: string;
      to?: string;
      businessId?: string;
    },
  ): Promise<QuotationResponseDto[]> {
    const rows = await this.quotationRepository.list({
      customerId: actor.userId,
      businessId: filters.businessId,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    });

    const result: QuotationResponseDto[] = [];
    for (const row of rows) {
      const current = await this.maybeExpire(actor, row);
      result.push(this.toAudienceDto(current, actor));
    }
    return result;
  }

  async listForBusiness(
    businessId: string,
    actor: ActorContext,
    filters: {
      status?: QuotationStatus | QuotationStatus[];
      from?: string;
      to?: string;
      customerId?: string;
    },
  ): Promise<QuotationResponseDto[]> {
    const rows = await this.quotationRepository.list({
      businessId,
      customerId: filters.customerId,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    });

    const result: QuotationResponseDto[] = [];
    for (const row of rows) {
      const current = await this.maybeExpire(actor, row);
      result.push(this.toAudienceDto(current, actor, { includeHistory: false }));
    }
    return result;
  }

  async getById(
    actor: ActorContext,
    quotationId: string,
  ): Promise<QuotationResponseDto> {
    let quotation = await this.loadAccessible(actor, quotationId, {
      includeHistory: true,
    });
    quotation = await this.maybeExpire(actor, quotation);
    return this.toAudienceDto(quotation, actor, { includeHistory: true });
  }

  async create(
    actor: ActorContext,
    businessId: string,
    input: CreateQuotationRequestDto,
    requestId?: string,
  ): Promise<QuotationResponseDto> {
    await this.assertQuotationsEnabled(businessId);
    await this.assertActiveBusinessContext(businessId, input.branchId);
    await this.validateLinks({
      businessId,
      branchId: input.branchId,
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      appointmentId: input.appointmentId,
    });

    const resolvedItems = await this.resolveItems(businessId, input.items);
    const totals = this.buildTotals(resolvedItems);

    const quotation = await this.quotationRepository.create({
      customerId: input.customerId,
      businessId,
      branchId: input.branchId,
      vehicleId: input.vehicleId ?? null,
      appointmentId: input.appointmentId ?? null,
      status: QuotationStatuses.Draft,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      validUntil: input.validUntil ?? null,
      customerMessage: input.customerMessage ?? null,
      businessNotes: input.businessNotes ?? null,
      createdBy: actor.userId,
      items: totals.items,
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "quotation.created",
      entityType: "quotation",
      entityId: quotation.id,
      requestId,
      newValues: { status: QuotationStatuses.Draft, businessId },
    });

    return this.toAudienceDto(quotation, actor);
  }

  async createFromAppointment(
    actor: ActorContext,
    businessId: string,
    appointmentId: string,
    input?: Partial<CreateQuotationRequestDto>,
    requestId?: string,
  ): Promise<QuotationResponseDto> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment || appointment.businessId !== businessId) {
      throw new ValidationError("Appointment was not found for this business.");
    }

    const items: QuotationItemInputDto[] = input?.items?.length
      ? input.items
      : appointment.services.map((service, index) => ({
        itemType: QuotationItemTypes.Service,
        serviceId: service.serviceId,
        description: service.serviceNameSnapshot,
        quantity: 1,
        unitPrice: service.quotedPrice ?? 0,
        sortOrder: index,
      }));

    if (items.length === 0) {
      throw new ValidationError("Appointment has no services to quote.");
    }

    return this.create(
      actor,
      businessId,
      {
        customerId: appointment.customerId,
        branchId: appointment.branchId,
        vehicleId: input?.vehicleId !== undefined
          ? input.vehicleId
          : appointment.vehicleId,
        appointmentId: appointment.id,
        validUntil: input?.validUntil,
        customerMessage: input?.customerMessage,
        businessNotes: input?.businessNotes,
        items,
      },
      requestId,
    );
  }

  async updateDraft(
    actor: ActorContext,
    businessId: string,
    quotationId: string,
    input: UpdateQuotationRequestDto,
    requestId?: string,
  ): Promise<QuotationResponseDto> {
    const quotation = await this.loadAccessible(actor, quotationId);
    if (quotation.businessId !== businessId) {
      throw new QuotationAccessDeniedError();
    }
    if (quotation.status !== QuotationStatuses.Draft) {
      throw new QuotationNotEditableError();
    }

    const branchId = input.branchId ?? quotation.branchId;
    await this.assertActiveBusinessContext(businessId, branchId);
    await this.validateLinks({
      businessId,
      branchId,
      customerId: quotation.customerId,
      vehicleId: input.vehicleId ?? quotation.vehicleId,
      appointmentId: input.appointmentId ?? quotation.appointmentId,
    });

    const resolvedItems = await this.resolveItems(businessId, input.items);
    const totals = this.buildTotals(resolvedItems);

    const updated = await this.quotationRepository.updateDraft({
      quotationId,
      branchId: input.branchId,
      vehicleId: input.vehicleId,
      appointmentId: input.appointmentId,
      validUntil: input.validUntil,
      customerMessage: input.customerMessage,
      businessNotes: input.businessNotes,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      grandTotal: totals.grandTotal,
      items: totals.items,
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "quotation.updated",
      entityType: "quotation",
      entityId: quotationId,
      requestId,
    });

    return this.toAudienceDto(updated, actor);
  }

  async issue(
    actor: ActorContext,
    businessId: string,
    quotationId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ): Promise<QuotationResponseDto> {
    const quotation = await this.loadAccessible(actor, quotationId);
    if (quotation.businessId !== businessId) {
      throw new QuotationAccessDeniedError();
    }
    if (quotation.status !== QuotationStatuses.Draft) {
      throw new QuotationNotEditableError("Only draft quotations can be issued.");
    }

    assertTransition(quotation.status, QuotationStatuses.Issued);
    const issuedAt = new Date().toISOString();

    const updated = await this.quotationRepository.transition({
      quotationId,
      fromStatus: quotation.status,
      toStatus: QuotationStatuses.Issued,
      actorUserId: actor.userId,
      note: body.note ?? null,
      patch: { issuedAt },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "quotation.issued",
      entityType: "quotation",
      entityId: quotationId,
      requestId,
      previousStatus: quotation.status,
      newStatus: QuotationStatuses.Issued,
    });

    await this.safeNotify({
      userId: quotation.customerId,
      type: "quotation_issued",
      title: "New quotation",
      body: "You have received a new quotation.",
      entityId: quotationId,
    });

    return this.toAudienceDto(updated, actor);
  }

  async view(
    actor: ActorContext,
    quotationId: string,
    requestId?: string,
  ): Promise<QuotationResponseDto> {
    let quotation = await this.loadAccessible(actor, quotationId);
    if (quotation.customerId !== actor.userId) {
      throw new QuotationAccessDeniedError();
    }

    quotation = await this.maybeExpire(actor, quotation);
    if (quotation.status === QuotationStatuses.Expired) {
      throw new QuotationExpiredError();
    }

    if (quotation.status === QuotationStatuses.Viewed) {
      return this.toAudienceDto(quotation, actor);
    }

    if (quotation.status !== QuotationStatuses.Issued) {
      throw new QuotationNotEditableError("Only issued quotations can be viewed.");
    }

    assertTransition(QuotationStatuses.Issued, QuotationStatuses.Viewed);
    const viewedAt = new Date().toISOString();

    const updated = await this.quotationRepository.transition({
      quotationId,
      fromStatus: QuotationStatuses.Issued,
      toStatus: QuotationStatuses.Viewed,
      actorUserId: actor.userId,
      note: "viewed",
      patch: { viewedAt },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "quotation.viewed",
      entityType: "quotation",
      entityId: quotationId,
      requestId,
      previousStatus: QuotationStatuses.Issued,
      newStatus: QuotationStatuses.Viewed,
    });

    return this.toAudienceDto(updated, actor);
  }

  async accept(
    actor: ActorContext,
    quotationId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ): Promise<QuotationResponseDto> {
    let quotation = await this.loadAccessible(actor, quotationId);
    if (quotation.customerId !== actor.userId) {
      throw new QuotationAccessDeniedError();
    }
    if (quotation.status === QuotationStatuses.Accepted) {
      throw new QuotationAlreadyAcceptedError();
    }

    quotation = await this.maybeExpire(actor, quotation, requestId);
    if (quotation.status === QuotationStatuses.Expired) {
      throw new QuotationExpiredError();
    }

    if (
      quotation.status !== QuotationStatuses.Issued &&
      quotation.status !== QuotationStatuses.Viewed
    ) {
      throw new QuotationNotEditableError("Only issued or viewed quotations can be accepted.");
    }

    assertTransition(quotation.status, QuotationStatuses.Accepted);
    const acceptedAt = new Date().toISOString();

    const updated = await this.quotationRepository.transition({
      quotationId,
      fromStatus: quotation.status,
      toStatus: QuotationStatuses.Accepted,
      actorUserId: actor.userId,
      note: body.note ?? null,
      patch: { acceptedAt },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "quotation.accepted",
      entityType: "quotation",
      entityId: quotationId,
      requestId,
      previousStatus: quotation.status,
      newStatus: QuotationStatuses.Accepted,
    });

    await this.notifyBusinessStaff(quotation.businessId, {
      type: "quotation_accepted",
      title: "Quotation accepted",
      body: "A customer accepted a quotation.",
      entityId: quotationId,
    });

    return this.toAudienceDto(updated, actor);
  }

  async reject(
    actor: ActorContext,
    quotationId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ): Promise<QuotationResponseDto> {
    let quotation = await this.loadAccessible(actor, quotationId);
    if (quotation.customerId !== actor.userId) {
      throw new QuotationAccessDeniedError();
    }

    quotation = await this.maybeExpire(actor, quotation, requestId);
    if (quotation.status === QuotationStatuses.Expired) {
      throw new QuotationExpiredError();
    }

    if (
      quotation.status !== QuotationStatuses.Issued &&
      quotation.status !== QuotationStatuses.Viewed
    ) {
      throw new QuotationNotEditableError("Only issued or viewed quotations can be rejected.");
    }

    assertTransition(quotation.status, QuotationStatuses.Rejected);
    const rejectedAt = new Date().toISOString();

    const updated = await this.quotationRepository.transition({
      quotationId,
      fromStatus: quotation.status,
      toStatus: QuotationStatuses.Rejected,
      actorUserId: actor.userId,
      note: body.note ?? null,
      patch: { rejectedAt },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "quotation.rejected",
      entityType: "quotation",
      entityId: quotationId,
      requestId,
      previousStatus: quotation.status,
      newStatus: QuotationStatuses.Rejected,
    });

    await this.notifyBusinessStaff(quotation.businessId, {
      type: "quotation_rejected",
      title: "Quotation rejected",
      body: "A customer rejected a quotation.",
      entityId: quotationId,
    });

    return this.toAudienceDto(updated, actor);
  }

  async cancel(
    actor: ActorContext,
    businessId: string,
    quotationId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ): Promise<QuotationResponseDto> {
    const quotation = await this.loadAccessible(actor, quotationId);
    if (quotation.businessId !== businessId) {
      throw new QuotationAccessDeniedError();
    }

    if (
      quotation.status !== QuotationStatuses.Draft &&
      quotation.status !== QuotationStatuses.Issued &&
      quotation.status !== QuotationStatuses.Viewed
    ) {
      throw new QuotationNotEditableError(
        "Only draft, issued, or viewed quotations can be cancelled.",
      );
    }

    assertTransition(quotation.status, QuotationStatuses.Cancelled);
    const cancelledAt = new Date().toISOString();

    const updated = await this.quotationRepository.transition({
      quotationId,
      fromStatus: quotation.status,
      toStatus: QuotationStatuses.Cancelled,
      actorUserId: actor.userId,
      note: body.note ?? null,
      patch: { cancelledAt },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "quotation.cancelled",
      entityType: "quotation",
      entityId: quotationId,
      requestId,
      previousStatus: quotation.status,
      newStatus: QuotationStatuses.Cancelled,
    });

    await this.safeNotify({
      userId: quotation.customerId,
      type: "quotation_cancelled",
      title: "Quotation cancelled",
      body: "Your quotation was cancelled.",
      entityId: quotationId,
    });

    return this.toAudienceDto(updated, actor);
  }

  async revise(
    actor: ActorContext,
    businessId: string,
    quotationId: string,
    requestId?: string,
  ): Promise<QuotationResponseDto> {
    const quotation = await this.loadAccessible(actor, quotationId);
    if (quotation.businessId !== businessId) {
      throw new QuotationAccessDeniedError();
    }
    if (quotation.status === QuotationStatuses.Accepted) {
      throw new QuotationAlreadyAcceptedError();
    }
    if (!REVISABLE_STATUSES.includes(quotation.status)) {
      throw new QuotationRevisionConflictError();
    }

    const revised = await this.quotationRepository.revise(
      quotationId,
      actor.userId,
    );

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "quotation.revised",
      entityType: "quotation",
      entityId: revised.id,
      requestId,
      newValues: {
        previousRevisionId: quotationId,
        revisionNumber: revised.revisionNumber,
      },
    });

    await this.safeNotify({
      userId: quotation.customerId,
      type: "quotation_revised",
      title: "Quotation revised",
      body: "A revised quotation draft has been prepared.",
      entityId: revised.id,
      metadata: { previousQuotationId: quotationId },
    });

    return this.toAudienceDto(revised, actor);
  }
}
