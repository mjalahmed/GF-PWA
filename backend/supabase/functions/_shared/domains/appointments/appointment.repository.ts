import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import {
  AppointmentStatuses,
  AppointmentTerminalStatuses,
  type AppointmentStatus,
} from "../../core/constants/statuses.ts";
import type { AppointmentRepository } from "./appointment.repository.interface.ts";
import type {
  AppointmentRecord,
  AppointmentServiceRecord,
  AppointmentStatusHistoryRecord,
  CreateAppointmentPersistenceInput,
  ListAppointmentsFilters,
  OverlapQuery,
  TransitionPersistenceInput,
} from "./appointment.types.ts";

type AppointmentRow = {
  id: string;
  customer_id: string;
  business_id: string;
  branch_id: string;
  vehicle_id: string | null;
  status: AppointmentStatus;
  scheduled_start: string;
  scheduled_end: string;
  customer_notes: string | null;
  business_notes: string | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  confirmed_at: string | null;
  arrived_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ServiceRow = {
  id: string;
  appointment_id: string;
  service_id: string;
  service_name_snapshot: string;
  estimated_duration_minutes: number;
  quoted_price: number | null;
  created_at: string;
};

type HistoryRow = {
  id: string;
  appointment_id: string;
  from_status: AppointmentStatus | null;
  to_status: AppointmentStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

const APPOINTMENT_SELECT =
  "id, customer_id, business_id, branch_id, vehicle_id, status, scheduled_start, scheduled_end, customer_notes, business_notes, cancellation_reason, cancelled_by, confirmed_at, arrived_at, started_at, completed_at, created_at, updated_at";

const SERVICE_SELECT =
  "id, appointment_id, service_id, service_name_snapshot, estimated_duration_minutes, quoted_price, created_at";

const HISTORY_SELECT =
  "id, appointment_id, from_status, to_status, changed_by, note, created_at";

function toService(row: ServiceRow): AppointmentServiceRecord {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    serviceId: row.service_id,
    serviceNameSnapshot: row.service_name_snapshot,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    quotedPrice: row.quoted_price == null ? null : Number(row.quoted_price),
    createdAt: row.created_at,
  };
}

function toHistory(row: HistoryRow): AppointmentStatusHistoryRecord {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedBy: row.changed_by,
    note: row.note,
    createdAt: row.created_at,
  };
}

function toAppointment(
  row: AppointmentRow,
  services: AppointmentServiceRecord[],
  history?: AppointmentStatusHistoryRecord[],
): AppointmentRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    businessId: row.business_id,
    branchId: row.branch_id,
    vehicleId: row.vehicle_id,
    status: row.status,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    customerNotes: row.customer_notes,
    businessNotes: row.business_notes,
    cancellationReason: row.cancellation_reason,
    cancelledBy: row.cancelled_by,
    confirmedAt: row.confirmed_at,
    arrivedAt: row.arrived_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    services,
    statusHistory: history,
  };
}

export class SupabaseAppointmentRepository implements AppointmentRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  private async loadServices(
    appointmentIds: string[],
  ): Promise<Map<string, AppointmentServiceRecord[]>> {
    const map = new Map<string, AppointmentServiceRecord[]>();
    if (appointmentIds.length === 0) return map;

    const { data, error } = await this.adminClient
      .from("appointment_services")
      .select(SERVICE_SELECT)
      .in("appointment_id", appointmentIds);

    if (error) throw new InternalError("Failed to load appointment services.", error);

    for (const row of (data ?? []) as ServiceRow[]) {
      const list = map.get(row.appointment_id) ?? [];
      list.push(toService(row));
      map.set(row.appointment_id, list);
    }
    return map;
  }

  private async loadHistory(
    appointmentId: string,
  ): Promise<AppointmentStatusHistoryRecord[]> {
    const { data, error } = await this.adminClient
      .from("appointment_status_history")
      .select(HISTORY_SELECT)
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: true });

    if (error) throw new InternalError("Failed to load appointment history.", error);
    return ((data ?? []) as HistoryRow[]).map(toHistory);
  }

  async findById(
    appointmentId: string,
    options?: { includeHistory?: boolean },
  ): Promise<AppointmentRecord | null> {
    const { data, error } = await this.adminClient
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("id", appointmentId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load appointment.", error);
    if (!data) return null;

    const servicesMap = await this.loadServices([appointmentId]);
    const history = options?.includeHistory
      ? await this.loadHistory(appointmentId)
      : undefined;

    return toAppointment(
      data as AppointmentRow,
      servicesMap.get(appointmentId) ?? [],
      history,
    );
  }

  async list(filters: ListAppointmentsFilters): Promise<AppointmentRecord[]> {
    let query = this.adminClient
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .order("scheduled_start", { ascending: true });

    if (filters.customerId) query = query.eq("customer_id", filters.customerId);
    if (filters.businessId) query = query.eq("business_id", filters.businessId);
    if (filters.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters.from) query = query.gte("scheduled_start", filters.from);
    if (filters.to) query = query.lte("scheduled_start", filters.to);
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    }

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list appointments.", error);

    const rows = (data ?? []) as AppointmentRow[];
    const servicesMap = await this.loadServices(rows.map((r) => r.id));
    return rows.map((row) =>
      toAppointment(row, servicesMap.get(row.id) ?? [])
    );
  }

  async listOverlapping(query: OverlapQuery): Promise<AppointmentRecord[]> {
    // Overlap: existing.start < newEnd AND existing.end > newStart
    const { data, error } = await this.adminClient
      .from("appointments")
      .select(APPOINTMENT_SELECT)
      .eq("branch_id", query.branchId)
      .lt("scheduled_start", query.scheduledEnd)
      .gt("scheduled_end", query.scheduledStart);

    if (error) throw new InternalError("Failed to check appointment conflicts.", error);

    const terminal = new Set<string>(AppointmentTerminalStatuses);
    let rows = ((data ?? []) as AppointmentRow[]).filter(
      (r) => !terminal.has(r.status),
    );
    if (query.excludeAppointmentId) {
      rows = rows.filter((r) => r.id !== query.excludeAppointmentId);
    }

    const servicesMap = await this.loadServices(rows.map((r) => r.id));
    return rows.map((row) =>
      toAppointment(row, servicesMap.get(row.id) ?? [])
    );
  }

  async create(
    input: CreateAppointmentPersistenceInput,
  ): Promise<AppointmentRecord> {
    const { data, error } = await this.adminClient
      .from("appointments")
      .insert({
        customer_id: input.customerId,
        business_id: input.businessId,
        branch_id: input.branchId,
        vehicle_id: input.vehicleId,
        status: input.status,
        scheduled_start: input.scheduledStart,
        scheduled_end: input.scheduledEnd,
        customer_notes: input.customerNotes,
        confirmed_at: input.status === AppointmentStatuses.Confirmed
          ? new Date().toISOString()
          : null,
      })
      .select(APPOINTMENT_SELECT)
      .single();

    if (error) throw new InternalError("Failed to create appointment.", error);

    const appointment = data as AppointmentRow;
    const { data: serviceRows, error: serviceError } = await this.adminClient
      .from("appointment_services")
      .insert(
        input.services.map((s) => ({
          appointment_id: appointment.id,
          service_id: s.serviceId,
          service_name_snapshot: s.serviceNameSnapshot,
          estimated_duration_minutes: s.estimatedDurationMinutes,
          quoted_price: s.quotedPrice,
        })),
      )
      .select(SERVICE_SELECT);

    if (serviceError) {
      await this.adminClient.from("appointments").delete().eq("id", appointment.id);
      throw new InternalError("Failed to create appointment services.", serviceError);
    }

    const { error: historyError } = await this.adminClient
      .from("appointment_status_history")
      .insert({
        appointment_id: appointment.id,
        from_status: null,
        to_status: input.status,
        changed_by: input.customerId,
        note: "created",
      });

    if (historyError) {
      throw new InternalError("Failed to write appointment history.", historyError);
    }

    return toAppointment(
      appointment,
      ((serviceRows ?? []) as ServiceRow[]).map(toService),
    );
  }

  async transition(
    input: TransitionPersistenceInput,
  ): Promise<AppointmentRecord> {
    const patch: Record<string, unknown> = {
      status: input.toStatus,
    };

    if (input.cancellationReason !== undefined) {
      patch.cancellation_reason = input.cancellationReason;
    }
    if (input.patch?.cancelledBy !== undefined) {
      patch.cancelled_by = input.patch.cancelledBy;
    }
    if (input.patch?.confirmedAt !== undefined) {
      patch.confirmed_at = input.patch.confirmedAt;
    }
    if (input.patch?.arrivedAt !== undefined) {
      patch.arrived_at = input.patch.arrivedAt;
    }
    if (input.patch?.startedAt !== undefined) {
      patch.started_at = input.patch.startedAt;
    }
    if (input.patch?.completedAt !== undefined) {
      patch.completed_at = input.patch.completedAt;
    }
    if (input.patch?.businessNotes !== undefined) {
      patch.business_notes = input.patch.businessNotes;
    }

    const { data, error } = await this.adminClient
      .from("appointments")
      .update(patch)
      .eq("id", input.appointmentId)
      .eq("status", input.fromStatus)
      .select(APPOINTMENT_SELECT)
      .maybeSingle();

    if (error) throw new InternalError("Failed to update appointment status.", error);
    if (!data) {
      throw new InternalError(
        "Appointment status changed concurrently.",
        { appointmentId: input.appointmentId },
      );
    }

    const { error: historyError } = await this.adminClient
      .from("appointment_status_history")
      .insert({
        appointment_id: input.appointmentId,
        from_status: input.fromStatus,
        to_status: input.toStatus,
        changed_by: input.actorUserId,
        note: input.note ?? null,
      });

    if (historyError) {
      throw new InternalError("Failed to write appointment history.", historyError);
    }

    const servicesMap = await this.loadServices([input.appointmentId]);
    return toAppointment(
      data as AppointmentRow,
      servicesMap.get(input.appointmentId) ?? [],
    );
  }
}
