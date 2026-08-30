import type { BusinessMembershipRecord, MembershipRole } from "./business.types.ts";

export interface MembershipRepository {
  listByBusiness(businessId: string): Promise<BusinessMembershipRecord[]>;
  findById(
    businessId: string,
    membershipId: string,
  ): Promise<BusinessMembershipRecord | null>;
  updateRoleViaRpc(
    membershipId: string,
    newRole: MembershipRole,
    actorUserId: string,
  ): Promise<{ membershipId: string; previousRole: string; newRole: string }>;
  suspendViaRpc(
    membershipId: string,
    actorUserId: string,
  ): Promise<{ membershipId: string }>;
  restoreViaRpc(
    membershipId: string,
    actorUserId: string,
  ): Promise<{ membershipId: string }>;
  removeViaRpc(
    membershipId: string,
    actorUserId: string,
  ): Promise<{ membershipId: string; idempotent: boolean }>;
}
