import type { BranchResponseDto } from "./branch.dto.ts";
import type { BusinessBranchRecord } from "./business.types.ts";

export class BranchMapper {
  static toDto(record: BusinessBranchRecord): BranchResponseDto {
    return {
      id: record.id,
      businessId: record.businessId,
      name: record.name,
      phone: record.phone,
      email: record.email,
      addressLine: record.addressLine,
      area: record.area,
      city: record.city,
      countryCode: record.countryCode,
      latitude: record.latitude,
      longitude: record.longitude,
      timezone: record.timezone,
      isPrimary: record.isPrimary,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
