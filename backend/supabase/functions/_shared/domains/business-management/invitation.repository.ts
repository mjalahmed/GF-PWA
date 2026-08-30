import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import { mapRpcError } from "./business.errors.ts";
import type { InvitationRepository } from "./invitation.repository.interface.ts";
import type {
  BusinessInvitationRecord,
  CreateInvitationPersistenceInput,
  InvitationStatus,
  MembershipRole,
} from "./business.types.ts";

type InvitationRow = {
  id: string;
  business_id: string;
  email: string;
  membership_role: MembershipRole;
  token_hash: string;
  status: InvitationStatus;
  invited_by: string;
  expires_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

const INVITATION_SELECT =
  "id, business_id, email, membership_role, token_hash, status, invited_by, expires_at, accepted_by, accepted_at, revoked_at, created_at, updated_at";

function toInvitationRecord(row: InvitationRow): BusinessInvitationRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    email: row.email,
    membershipRole: row.membership_role,
    tokenHash: row.token_hash,
    status: row.status,
    invitedBy: row.invited_by,
    expiresAt: row.expires_at,
    acceptedBy: row.accepted_by,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseError(error: { code?: string; message?: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "A pending invitation already exists for this email.",
      error,
    );
  }
  throw new InternalError("Database operation failed.", error);
}

export async function hashInvitationToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class SupabaseInvitationRepository implements InvitationRepository {
  constructor(
    private readonly userClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async listByBusiness(businessId: string): Promise<BusinessInvitationRecord[]> {
    const { data, error } = await this.userClient
      .from("business_invitations")
      .select(INVITATION_SELECT)
      .eq("business_id", businessId)
      .in("status", ["pending", "accepted", "expired", "revoked"])
      .order("created_at", { ascending: false });

    if (error) throw new InternalError("Failed to list invitations.", error);
    return ((data ?? []) as InvitationRow[]).map(toInvitationRecord);
  }

  async findById(
    businessId: string,
    invitationId: string,
  ): Promise<BusinessInvitationRecord | null> {
    const { data, error } = await this.userClient
      .from("business_invitations")
      .select(INVITATION_SELECT)
      .eq("business_id", businessId)
      .eq("id", invitationId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load invitation.", error);
    if (!data) return null;
    return toInvitationRecord(data as InvitationRow);
  }

  async create(
    input: CreateInvitationPersistenceInput,
  ): Promise<BusinessInvitationRecord> {
    const { data, error } = await this.adminClient
      .from("business_invitations")
      .insert({
        business_id: input.businessId,
        email: input.email.trim().toLowerCase(),
        membership_role: input.membershipRole,
        token_hash: input.tokenHash,
        invited_by: input.invitedBy,
        expires_at: input.expiresAt,
        status: "pending",
      })
      .select(INVITATION_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create invitation.");
    return toInvitationRecord(data as InvitationRow);
  }

  async revoke(
    businessId: string,
    invitationId: string,
  ): Promise<BusinessInvitationRecord> {
    const { data, error } = await this.adminClient
      .from("business_invitations")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
      })
      .eq("business_id", businessId)
      .eq("id", invitationId)
      .eq("status", "pending")
      .select(INVITATION_SELECT)
      .maybeSingle();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Pending invitation was not found.");
    return toInvitationRecord(data as InvitationRow);
  }

  async acceptViaRpc(
    tokenHash: string,
    userId: string,
    userEmail: string,
  ): Promise<{
    invitationId: string;
    membershipId: string;
    businessId: string;
    role: MembershipRole;
  }> {
    const { data, error } = await this.adminClient.rpc(
      "accept_business_invitation",
      {
        p_token_hash: tokenHash,
        p_user_id: userId,
        p_user_email: userEmail,
      },
    );

    if (error) mapRpcError(error.message ?? "Accept invitation failed.");
    const result = data as {
      invitationId: string;
      membershipId: string;
      businessId: string;
      role: MembershipRole;
    };
    return result;
  }

  async revokePendingForEmail(businessId: string, email: string): Promise<void> {
    const { error } = await this.adminClient
      .from("business_invitations")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
      })
      .eq("business_id", businessId)
      .eq("status", "pending")
      .ilike("email", email.trim().toLowerCase());

    if (error) throw new InternalError("Failed to revoke pending invitation.", error);
  }
}
