import type { AppointmentStatus } from "../../core/constants/statuses.ts";

export type AppointmentServiceDto = {
  id: string;
  serviceId: string;
  serviceName: string;
  estimatedDurationMinutes: number;
  quotedPrice: number | null;
};

export type AppointmentStatusHistoryDto = {
  id: string;
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
};

export type AppointmentResponseDto = {
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
  services: AppointmentServiceDto[];
  statusHistory?: AppointmentStatusHistoryDto[];
};

export type CreateAppointmentRequestDto = {
  businessId: string;
  branchId: string;
  serviceId: string;
  vehicleId?: string | null;
  scheduledStart: string;
  customerNotes?: string | null;
};

export type TransitionRequestDto = {
  note?: string | null;
  reason?: string | null;
};

export type AppointmentSlotDto = {
  start: string;
  end: string;
};

export type AppointmentSlotsResponseDto = {
  date: string;
  durationMinutes: number;
  slots: AppointmentSlotDto[];
};
