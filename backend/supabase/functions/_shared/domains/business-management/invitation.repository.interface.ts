import type {
  BusinessInvitationRecord,
  CreateInvitationPersistenceInput,
  MembershipRole,
} from "./business.types.ts";

export interface InvitationRepository {
  listByBusiness(businessId: string): Promise<BusinessInvitationRecord[]>;
  findById(
    businessId: string,
    invitationId: string,
  ): Promise<BusinessInvitationRecord | null>;
  create(input: CreateInvitationPersistenceInput): Promise<BusinessInvitationRecord>;
  revoke(businessId: string, invitationId: string): Promise<BusinessInvitationRecord>;
  acceptViaRpc(
    tokenHash: string,
    userId: string,
    userEmail: string,
  ): Promise<{
    invitationId: string;
    membershipId: string;
    businessId: string;
    role: MembershipRole;
  }>;
  revokePendingForEmail(businessId: string, email: string): Promise<void>;
}
