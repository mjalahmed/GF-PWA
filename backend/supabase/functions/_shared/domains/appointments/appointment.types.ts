import type { AppointmentStatus } from "../../core/constants/statuses.ts";

export type AppointmentServiceRecord = {
  id: string;
  appointmentId: string;
  serviceId: string;
  serviceNameSnapshot: string;
  estimatedDurationMinutes: number;
  quotedPrice: number | null;
  createdAt: string;
};

export type AppointmentStatusHistoryRecord = {
  id: string;
  appointmentId: string;
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
};

export type AppointmentRecord = {
  id: string;
  customerId: string;
  businessId: string;
  branchId: string;
  vehicleId: string | null;
  status: AppointmentStatus;
  scheduledStart: string;
  scheduledEnd: string;
  customerNotes: string | null;
  businessNotes: string | null;
  cancellationReason: string | null;
  cancelledBy: string | null;
  confirmedAt: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  services: AppointmentServiceRecord[];
  statusHistory?: AppointmentStatusHistoryRecord[];
};

export type CreateAppointmentPersistenceInput = {
  customerId: string;
  businessId: string;
  branchId: string;
  vehicleId: string | null;
  status: AppointmentStatus;
  scheduledStart: string;
  scheduledEnd: string;
  customerNotes: string | null;
  services: Array<{
    serviceId: string;
    serviceNameSnapshot: string;
    estimatedDurationMinutes: number;
    quotedPrice: number | null;
  }>;
};

export type TransitionPersistenceInput = {
  appointmentId: string;
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
  actorUserId: string;
  note?: string | null;
  cancellationReason?: string | null;
  patch?: {
    confirmedAt?: string | null;
    arrivedAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    cancelledBy?: string | null;
    businessNotes?: string | null;
  };
};

export type ListAppointmentsFilters = {
  customerId?: string;
  businessId?: string;
  branchId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  from?: string;
  to?: string;
};

export type OverlapQuery = {
  branchId: string;
  scheduledStart: string;
  scheduledEnd: string;
  excludeAppointmentId?: string;
};

export const BRANCH_APPOINTMENT_CAPACITY = 1;
