import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import type { ScheduleRepository } from "./schedule.repository.interface.ts";
import type {
  ClosureDateRecord,
  CreateClosureDatePersistenceInput,
  OpeningHoursRecord,
  OpeningHoursUpsertInput,
  UpdateClosureDatePersistenceInput,
} from "./business.types.ts";

type OpeningHoursRow = {
  id: string;
  business_id: string;
  branch_id: string | null;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
};

type ClosureRow = {
  id: string;
  business_id: string;
  branch_id: string | null;
  closure_date: string;
  reason: string | null;
  is_full_day: boolean;
  opens_at: string | null;
  closes_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

const OPENING_HOURS_SELECT =
  "id, business_id, branch_id, day_of_week, opens_at, closes_at, is_closed, created_at, updated_at";

const CLOSURE_SELECT =
  "id, business_id, branch_id, closure_date, reason, is_full_day, opens_at, closes_at, created_by, created_at, updated_at";

function toOpeningHoursRecord(row: OpeningHoursRow): OpeningHoursRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    dayOfWeek: row.day_of_week,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    isClosed: row.is_closed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toClosureRecord(row: ClosureRow): ClosureDateRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    closureDate: row.closure_date,
    reason: row.reason,
    isFullDay: row.is_full_day,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseError(error: { code?: string; message?: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "A conflicting schedule record already exists.",
      error,
    );
  }
  throw new InternalError("Database operation failed.", error);
}

export class SupabaseScheduleRepository implements ScheduleRepository {
  constructor(
    private readonly userClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async listOpeningHours(
    businessId: string,
    branchId?: string | null,
  ): Promise<OpeningHoursRecord[]> {
    let query = this.userClient
      .from("business_opening_hours")
      .select(OPENING_HOURS_SELECT)
      .eq("business_id", businessId)
      .order("day_of_week");

    if (branchId === undefined || branchId === null) {
      query = query.is("branch_id", null);
    } else {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list opening hours.", error);
    return ((data ?? []) as OpeningHoursRow[]).map(toOpeningHoursRecord);
  }

  async replaceOpeningHours(
    businessId: string,
    branchId: string | null,
    schedule: OpeningHoursUpsertInput[],
  ): Promise<OpeningHoursRecord[]> {
    let deleteQuery = this.adminClient
      .from("business_opening_hours")
      .delete()
      .eq("business_id", businessId);

    if (branchId === null) {
      deleteQuery = deleteQuery.is("branch_id", null);
    } else {
      deleteQuery = deleteQuery.eq("branch_id", branchId);
    }

    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw new InternalError("Failed to replace opening hours.", deleteError);

    const rows = schedule.map((item) => ({
      business_id: businessId,
      branch_id: branchId,
      day_of_week: item.dayOfWeek,
      opens_at: item.isClosed ? null : item.opensAt ?? null,
      closes_at: item.isClosed ? null : item.closesAt ?? null,
      is_closed: item.isClosed,
    }));

    const { data, error } = await this.adminClient
      .from("business_opening_hours")
      .insert(rows)
      .select(OPENING_HOURS_SELECT)
      .order("day_of_week");

    if (error) mapSupabaseError(error);
    return ((data ?? []) as OpeningHoursRow[]).map(toOpeningHoursRecord);
  }

  async listClosureDates(
    businessId: string,
    filters?: { branchId?: string; from?: string; to?: string },
  ): Promise<ClosureDateRecord[]> {
    let query = this.userClient
      .from("business_closure_dates")
      .select(CLOSURE_SELECT)
      .eq("business_id", businessId)
      .order("closure_date");

    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.from) query = query.gte("closure_date", filters.from);
    if (filters?.to) query = query.lte("closure_date", filters.to);

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list closure dates.", error);
    return ((data ?? []) as ClosureRow[]).map(toClosureRecord);
  }

  async createClosureDate(
    businessId: string,
    input: CreateClosureDatePersistenceInput,
  ): Promise<ClosureDateRecord> {
    const { data, error } = await this.adminClient
      .from("business_closure_dates")
      .insert({
        business_id: businessId,
        branch_id: input.branchId ?? null,
        closure_date: input.closureDate,
        reason: input.reason ?? null,
        is_full_day: input.isFullDay,
        opens_at: input.isFullDay ? null : input.opensAt ?? null,
        closes_at: input.isFullDay ? null : input.closesAt ?? null,
        created_by: input.createdBy,
      })
      .select(CLOSURE_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create closure date.");
    return toClosureRecord(data as ClosureRow);
  }

  async updateClosureDate(
    businessId: string,
    closureId: string,
    input: UpdateClosureDatePersistenceInput,
  ): Promise<ClosureDateRecord> {
    const patch: Record<string, unknown> = {};
    if (input.branchId !== undefined) patch.branch_id = input.branchId;
    if (input.closureDate !== undefined) patch.closure_date = input.closureDate;
    if (input.reason !== undefined) patch.reason = input.reason;
    if (input.isFullDay !== undefined) patch.is_full_day = input.isFullDay;
    if (input.opensAt !== undefined) patch.opens_at = input.opensAt;
    if (input.closesAt !== undefined) patch.closes_at = input.closesAt;

    const { data, error } = await this.adminClient
      .from("business_closure_dates")
      .update(patch)
      .eq("business_id", businessId)
      .eq("id", closureId)
      .select(CLOSURE_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Closure date was not found.");
    return toClosureRecord(data as ClosureRow);
  }

  async deleteClosureDate(businessId: string, closureId: string): Promise<void> {
    const { error, count } = await this.adminClient
      .from("business_closure_dates")
      .delete({ count: "exact" })
      .eq("business_id", businessId)
      .eq("id", closureId);

    if (error) throw new InternalError("Failed to delete closure date.", error);
    if (!count) throw new NotFoundError("Closure date was not found.");
  }
}
