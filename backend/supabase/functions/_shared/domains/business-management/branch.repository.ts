import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import { mapRpcError } from "./business.errors.ts";
import type { BranchRepository } from "./branch.repository.interface.ts";
import type {
  BusinessBranchRecord,
  CreateBranchPersistenceInput,
  UpdateBranchPersistenceInput,
} from "./business.types.ts";

type BranchRow = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address_line: string;
  area: string | null;
  city: string | null;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const BRANCH_SELECT =
  "id, business_id, name, phone, email, address_line, area, city, country_code, latitude, longitude, timezone, is_primary, is_active, created_at, updated_at";

function toBranchRecord(row: BranchRow): BusinessBranchRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    addressLine: row.address_line,
    area: row.area,
    city: row.city,
    countryCode: row.country_code,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    isPrimary: row.is_primary,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseError(error: { code?: string; message?: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "A conflicting branch record already exists.",
      error,
    );
  }
  throw new InternalError("Database operation failed.", error);
}

export class SupabaseBranchRepository implements BranchRepository {
  constructor(
    private readonly userClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async listByBusiness(
    businessId: string,
    activeOnly = false,
  ): Promise<BusinessBranchRecord[]> {
    let query = this.userClient
      .from("business_branches")
      .select(BRANCH_SELECT)
      .eq("business_id", businessId)
      .order("is_primary", { ascending: false })
      .order("created_at");

    if (activeOnly) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list branches.", error);
    return ((data ?? []) as BranchRow[]).map(toBranchRecord);
  }

  async findById(
    businessId: string,
    branchId: string,
  ): Promise<BusinessBranchRecord | null> {
    const { data, error } = await this.userClient
      .from("business_branches")
      .select(BRANCH_SELECT)
      .eq("business_id", businessId)
      .eq("id", branchId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load branch.", error);
    if (!data) return null;
    return toBranchRecord(data as BranchRow);
  }

  async create(
    businessId: string,
    input: CreateBranchPersistenceInput,
  ): Promise<BusinessBranchRecord> {
    const { data, error } = await this.adminClient
      .from("business_branches")
      .insert({
        business_id: businessId,
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address_line: input.addressLine,
        area: input.area ?? null,
        city: input.city ?? null,
        country_code: input.countryCode ?? "BH",
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        timezone: input.timezone ?? "Asia/Bahrain",
        is_primary: input.isPrimary ?? false,
        is_active: true,
      })
      .select(BRANCH_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create branch.");
    return toBranchRecord(data as BranchRow);
  }

  async update(
    businessId: string,
    branchId: string,
    input: UpdateBranchPersistenceInput,
  ): Promise<BusinessBranchRecord> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.email !== undefined) patch.email = input.email;
    if (input.addressLine !== undefined) patch.address_line = input.addressLine;
    if (input.area !== undefined) patch.area = input.area;
    if (input.city !== undefined) patch.city = input.city;
    if (input.countryCode !== undefined) patch.country_code = input.countryCode;
    if (input.latitude !== undefined) patch.latitude = input.latitude;
    if (input.longitude !== undefined) patch.longitude = input.longitude;
    if (input.timezone !== undefined) patch.timezone = input.timezone;

    const { data, error } = await this.adminClient
      .from("business_branches")
      .update(patch)
      .eq("business_id", businessId)
      .eq("id", branchId)
      .select(BRANCH_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Branch was not found.");
    return toBranchRecord(data as BranchRow);
  }

  async makePrimaryViaRpc(
    businessId: string,
    branchId: string,
    actorUserId: string,
  ): Promise<{ branchId: string; previousPrimaryBranchId: string | null }> {
    const { data, error } = await this.adminClient.rpc(
      "make_business_branch_primary",
      {
        p_business_id: businessId,
        p_branch_id: branchId,
        p_actor_user_id: actorUserId,
      },
    );

    if (error) mapRpcError(error.message ?? "Primary branch change failed.");
    const result = data as {
      branchId: string;
      previousPrimaryBranchId: string | null;
    };
    return {
      branchId: result.branchId,
      previousPrimaryBranchId: result.previousPrimaryBranchId ?? null,
    };
  }

  async deactivateViaRpc(
    businessId: string,
    branchId: string,
    actorUserId: string,
  ): Promise<{ branchId: string; idempotent: boolean }> {
    const { data, error } = await this.adminClient.rpc(
      "deactivate_business_branch",
      {
        p_business_id: businessId,
        p_branch_id: branchId,
        p_actor_user_id: actorUserId,
      },
    );

    if (error) mapRpcError(error.message ?? "Branch deactivation failed.");
    const result = data as { branchId: string; idempotent?: boolean };
    return {
      branchId: result.branchId,
      idempotent: result.idempotent ?? false,
    };
  }
}
