import type { InvitationResponseDto } from "./invitation.dto.ts";
import type { BusinessInvitationRecord } from "./business.types.ts";

export class InvitationMapper {
  static toDto(record: BusinessInvitationRecord): InvitationResponseDto {
    return {
      id: record.id,
      businessId: record.businessId,
      email: record.email,
      role: record.membershipRole,
      status: record.status,
      invitedBy: record.invitedBy,
      expiresAt: record.expiresAt,
      acceptedBy: record.acceptedBy,
      acceptedAt: record.acceptedAt,
      revokedAt: record.revokedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
