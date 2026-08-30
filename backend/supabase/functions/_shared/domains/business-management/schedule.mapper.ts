import type {
  ClosureDateResponseDto,
  OpeningHoursResponseDto,
} from "./schedule.dto.ts";
import type { ClosureDateRecord, OpeningHoursRecord } from "./business.types.ts";

export class ScheduleMapper {
  static toOpeningHoursDto(record: OpeningHoursRecord): OpeningHoursResponseDto {
    return {
      id: record.id,
      businessId: record.businessId,
      branchId: record.branchId,
      dayOfWeek: record.dayOfWeek,
      opensAt: record.opensAt,
      closesAt: record.closesAt,
      isClosed: record.isClosed,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toClosureDateDto(record: ClosureDateRecord): ClosureDateResponseDto {
    return {
      id: record.id,
      businessId: record.businessId,
      branchId: record.branchId,
      closureDate: record.closureDate,
      reason: record.reason,
      isFullDay: record.isFullDay,
      opensAt: record.opensAt,
      closesAt: record.closesAt,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
