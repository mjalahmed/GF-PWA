import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import { mapRpcError } from "./business.errors.ts";
import type { MembershipRepository } from "./membership.repository.interface.ts";
import type { BusinessMembershipRecord, MembershipRole } from "./business.types.ts";

type MembershipRow = {
  id: string;
  business_id: string;
  user_id: string;
  role: MembershipRole;
  status: string;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  suspended_at: string | null;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
};

const MEMBERSHIP_SELECT =
  "id, business_id, user_id, role, status, invited_by, invited_at, accepted_at, suspended_at, removed_at, created_at, updated_at";

function toMembershipRecord(row: MembershipRow): BusinessMembershipRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    role: row.role,
    status: row.status as BusinessMembershipRecord["status"],
    invitedBy: row.invited_by,
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
    suspendedAt: row.suspended_at,
    removedAt: row.removed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseMembershipRepository implements MembershipRepository {
  constructor(
    private readonly userClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async listByBusiness(businessId: string): Promise<BusinessMembershipRecord[]> {
    const { data, error } = await this.userClient
      .from("business_memberships")
      .select(MEMBERSHIP_SELECT)
      .eq("business_id", businessId)
      .neq("status", "removed")
      .order("role")
      .order("created_at");

    if (error) throw new InternalError("Failed to list memberships.", error);
    return ((data ?? []) as MembershipRow[]).map(toMembershipRecord);
  }

  async findById(
    businessId: string,
    membershipId: string,
  ): Promise<BusinessMembershipRecord | null> {
    const { data, error } = await this.adminClient
      .from("business_memberships")
      .select(MEMBERSHIP_SELECT)
      .eq("business_id", businessId)
      .eq("id", membershipId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load membership.", error);
    if (!data) return null;
    return toMembershipRecord(data as MembershipRow);
  }

  async updateRoleViaRpc(
    membershipId: string,
    newRole: MembershipRole,
    actorUserId: string,
  ): Promise<{ membershipId: string; previousRole: string; newRole: string }> {
    const { data, error } = await this.adminClient.rpc(
      "update_business_membership_role",
      {
        p_membership_id: membershipId,
        p_new_role: newRole,
        p_actor_user_id: actorUserId,
      },
    );

    if (error) mapRpcError(error.message ?? "Role update failed.");
    const result = data as {
      membershipId: string;
      previousRole: string;
      newRole: string;
    };
    return result;
  }

  async suspendViaRpc(
    membershipId: string,
    actorUserId: string,
  ): Promise<{ membershipId: string }> {
    const { data, error } = await this.adminClient.rpc(
      "suspend_business_membership",
      { p_membership_id: membershipId, p_actor_user_id: actorUserId },
    );

    if (error) mapRpcError(error.message ?? "Suspend failed.");
    return data as { membershipId: string };
  }

  async restoreViaRpc(
    membershipId: string,
    actorUserId: string,
  ): Promise<{ membershipId: string }> {
    const { data, error } = await this.adminClient.rpc(
      "restore_business_membership",
      { p_membership_id: membershipId, p_actor_user_id: actorUserId },
    );

    if (error) mapRpcError(error.message ?? "Restore failed.");
    return data as { membershipId: string };
  }

  async removeViaRpc(
    membershipId: string,
    actorUserId: string,
  ): Promise<{ membershipId: string; idempotent: boolean }> {
    const { data, error } = await this.adminClient.rpc(
      "remove_business_membership",
      { p_membership_id: membershipId, p_actor_user_id: actorUserId },
    );

    if (error) mapRpcError(error.message ?? "Remove failed.");
    const result = data as { membershipId: string; idempotent?: boolean };
    return {
      membershipId: result.membershipId,
      idempotent: result.idempotent ?? false,
    };
  }
}
