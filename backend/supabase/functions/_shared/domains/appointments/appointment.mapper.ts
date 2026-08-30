import type {
  AppointmentResponseDto,
  AppointmentServiceDto,
  AppointmentStatusHistoryDto,
} from "./appointment.dto.ts";
import type {
  AppointmentRecord,
  AppointmentServiceRecord,
  AppointmentStatusHistoryRecord,
} from "./appointment.types.ts";

export class AppointmentMapper {
  static toServiceDto(record: AppointmentServiceRecord): AppointmentServiceDto {
    return {
      id: record.id,
      serviceId: record.serviceId,
      serviceName: record.serviceNameSnapshot,
      estimatedDurationMinutes: record.estimatedDurationMinutes,
      quotedPrice: record.quotedPrice,
    };
  }

  static toHistoryDto(
    record: AppointmentStatusHistoryRecord,
  ): AppointmentStatusHistoryDto {
    return {
      id: record.id,
      fromStatus: record.fromStatus,
      toStatus: record.toStatus,
      changedBy: record.changedBy,
      note: record.note,
      createdAt: record.createdAt,
    };
  }

  static toDto(
    record: AppointmentRecord,
    options?: { includeHistory?: boolean },
  ): AppointmentResponseDto {
    return {
      id: record.id,
      customerId: record.customerId,
      businessId: record.businessId,
      branchId: record.branchId,
      vehicleId: record.vehicleId,
      status: record.status,
      scheduledStart: record.scheduledStart,
      scheduledEnd: record.scheduledEnd,
      customerNotes: record.customerNotes,
      businessNotes: record.businessNotes,
      cancellationReason: record.cancellationReason,
      cancelledBy: record.cancelledBy,
      confirmedAt: record.confirmedAt,
      arrivedAt: record.arrivedAt,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      services: record.services.map(AppointmentMapper.toServiceDto),
      statusHistory: options?.includeHistory && record.statusHistory
        ? record.statusHistory.map(AppointmentMapper.toHistoryDto)
        : undefined,
    };
  }
}
