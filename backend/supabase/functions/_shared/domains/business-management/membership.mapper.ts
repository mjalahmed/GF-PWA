import type { MembershipResponseDto } from "./membership.dto.ts";
import type { BusinessMembershipRecord } from "./business.types.ts";

export class MembershipMapper {
  static toDto(record: BusinessMembershipRecord): MembershipResponseDto {
    return {
      id: record.id,
      businessId: record.businessId,
      userId: record.userId,
      role: record.role,
      status: record.status,
      invitedBy: record.invitedBy,
      invitedAt: record.invitedAt,
      acceptedAt: record.acceptedAt,
      suspendedAt: record.suspendedAt,
      removedAt: record.removedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
