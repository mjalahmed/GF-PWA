import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import type { BusinessReviewRepository } from "./business-review.repository.interface.ts";
import type {
  BusinessApplicationReviewRecord,
  CreateReviewPersistenceInput,
} from "./business-application.types.ts";

type ReviewRow = {
  id: string;
  application_id: string;
  reviewer_user_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const REVIEW_SELECT =
  "id, application_id, reviewer_user_id, action, previous_status, new_status, reason, notes, metadata, created_at";

function toReviewRecord(row: ReviewRow): BusinessApplicationReviewRecord {
  return {
    id: row.id,
    applicationId: row.application_id,
    reviewerUserId: row.reviewer_user_id,
    action: row.action,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    reason: row.reason,
    notes: row.notes,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export class SupabaseBusinessReviewRepository implements BusinessReviewRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  async create(
    input: CreateReviewPersistenceInput,
  ): Promise<BusinessApplicationReviewRecord> {
    const { data, error } = await this.adminClient
      .from("business_application_reviews")
      .insert({
        application_id: input.applicationId,
        reviewer_user_id: input.reviewerUserId,
        action: input.action,
        previous_status: input.previousStatus ?? null,
        new_status: input.newStatus ?? null,
        reason: input.reason ?? null,
        notes: input.notes ?? null,
        metadata: input.metadata ?? {},
      })
      .select(REVIEW_SELECT)
      .single();

    if (error) throw new InternalError("Failed to create review record.", error);
    if (!data) throw new InternalError("Failed to create review record.");
    return toReviewRecord(data as ReviewRow);
  }

  async listByApplication(
    applicationId: string,
  ): Promise<BusinessApplicationReviewRecord[]> {
    const { data, error } = await this.adminClient
      .from("business_application_reviews")
      .select(REVIEW_SELECT)
      .eq("application_id", applicationId)
      .order("created_at");

    if (error) throw new InternalError("Failed to list reviews.", error);
    return ((data ?? []) as ReviewRow[]).map(toReviewRecord);
  }
}
