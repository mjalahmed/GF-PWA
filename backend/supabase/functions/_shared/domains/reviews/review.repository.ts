import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import {
  ReviewReportStatuses,
  ReviewStatuses,
  type ReviewRatingDimension,
  type ReviewReportReason,
  type ReviewReportStatus,
  type ReviewStatus,
  type ReviewVerificationType,
} from "../../core/constants/statuses.ts";
import {
  ReviewReportAlreadyOpenError,
  ReviewResponseAlreadyExistsError,
  mapReviewRpcError,
} from "./review.errors.ts";
import type { ReviewRepository } from "./review.repository.interface.ts";
import type {
  CreateReportPersistenceInput,
  DimensionRatingsInput,
  ListEligibilitiesFilters,
  ListReviewReportsFilters,
  ListReviewsFilters,
  ModerateReviewPersistenceInput,
  ResolveReportPersistenceInput,
  ReviewEligibilityRecord,
  ReviewRatingRecord,
  ReviewRecord,
  ReviewReportRecord,
  ReviewResponseRecord,
  UpdateReviewPersistenceInput,
  UpsertResponsePersistenceInput,
} from "./review.types.ts";

type EligibilityRow = {
  id: string;
  customer_id: string;
  business_id: string;
  appointment_id: string | null;
  invoice_id: string | null;
  verification_type: ReviewVerificationType;
  is_used: boolean;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type ReviewRow = {
  id: string;
  eligibility_id: string;
  customer_id: string;
  business_id: string;
  overall_rating: number;
  comment: string | null;
  status: ReviewStatus;
  published_at: string | null;
  edited_at: string | null;
  created_at: string;
  updated_at: string;
};

type RatingRow = {
  id: string;
  review_id: string;
  dimension: ReviewRatingDimension;
  rating: number;
  created_at: string;
};

type ResponseRow = {
  id: string;
  review_id: string;
  business_id: string;
  responded_by: string;
  response: string;
  created_at: string;
  updated_at: string;
};

type ReportRow = {
  id: string;
  review_id: string;
  reported_by: string;
  reason_code: ReviewReportReason;
  details: string | null;
  status: ReviewReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
};

const ELIGIBILITY_SELECT =
  "id, customer_id, business_id, appointment_id, invoice_id, verification_type, is_used, used_at, expires_at, created_at, updated_at";

const REVIEW_SELECT =
  "id, eligibility_id, customer_id, business_id, overall_rating, comment, status, published_at, edited_at, created_at, updated_at";

const RATING_SELECT = "id, review_id, dimension, rating, created_at";

const RESPONSE_SELECT =
  "id, review_id, business_id, responded_by, response, created_at, updated_at";

const REPORT_SELECT =
  "id, review_id, reported_by, reason_code, details, status, created_at, resolved_at, resolved_by";

function toEligibility(row: EligibilityRow): ReviewEligibilityRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    businessId: row.business_id,
    appointmentId: row.appointment_id,
    invoiceId: row.invoice_id,
    verificationType: row.verification_type,
    isUsed: row.is_used,
    usedAt: row.used_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRating(row: RatingRow): ReviewRatingRecord {
  return {
    id: row.id,
    reviewId: row.review_id,
    dimension: row.dimension,
    rating: row.rating,
    createdAt: row.created_at,
  };
}

function toResponse(row: ResponseRow): ReviewResponseRecord {
  return {
    id: row.id,
    reviewId: row.review_id,
    businessId: row.business_id,
    respondedBy: row.responded_by,
    response: row.response,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toReport(row: ReportRow): ReviewReportRecord {
  return {
    id: row.id,
    reviewId: row.review_id,
    reportedBy: row.reported_by,
    reasonCode: row.reason_code,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
  };
}

function sortOrder(sort?: ListReviewsFilters["sort"]): {
  column: string;
  ascending: boolean;
} {
  switch (sort) {
    case "highest":
      return { column: "overall_rating", ascending: false };
    case "lowest":
      return { column: "overall_rating", ascending: true };
    default:
      return { column: "created_at", ascending: false };
  }
}

export class SupabaseReviewRepository implements ReviewRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  private async loadVerificationTypes(
    eligibilityIds: string[],
  ): Promise<Map<string, ReviewVerificationType>> {
    const map = new Map<string, ReviewVerificationType>();
    if (eligibilityIds.length === 0) return map;

    const { data, error } = await this.adminClient
      .from("review_eligibilities")
      .select("id, verification_type")
      .in("id", eligibilityIds);

    if (error) throw new InternalError("Failed to load review eligibilities.", error);

    for (const row of (data ?? []) as Array<{
      id: string;
      verification_type: ReviewVerificationType;
    }>) {
      map.set(row.id, row.verification_type);
    }
    return map;
  }

  private async loadProfileNames(
    userIds: string[],
  ): Promise<Map<string, string | null>> {
    const map = new Map<string, string | null>();
    if (userIds.length === 0) return map;

    const { data, error } = await this.adminClient
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (error) throw new InternalError("Failed to load reviewer profiles.", error);

    for (const row of (data ?? []) as Array<{ id: string; full_name: string | null }>) {
      map.set(row.id, row.full_name);
    }
    return map;
  }

  private async loadRatingsForReviews(
    reviewIds: string[],
  ): Promise<Map<string, ReviewRatingRecord[]>> {
    const map = new Map<string, ReviewRatingRecord[]>();
    if (reviewIds.length === 0) return map;

    const { data, error } = await this.adminClient
      .from("review_ratings")
      .select(RATING_SELECT)
      .in("review_id", reviewIds);

    if (error) throw new InternalError("Failed to load review ratings.", error);

    for (const row of (data ?? []) as RatingRow[]) {
      const list = map.get(row.review_id) ?? [];
      list.push(toRating(row));
      map.set(row.review_id, list);
    }
    return map;
  }

  private async loadResponsesForReviews(
    reviewIds: string[],
  ): Promise<Map<string, ReviewResponseRecord>> {
    const map = new Map<string, ReviewResponseRecord>();
    if (reviewIds.length === 0) return map;

    const { data, error } = await this.adminClient
      .from("review_responses")
      .select(RESPONSE_SELECT)
      .in("review_id", reviewIds);

    if (error) throw new InternalError("Failed to load review responses.", error);

    for (const row of (data ?? []) as ResponseRow[]) {
      map.set(row.review_id, toResponse(row));
    }
    return map;
  }

  private async hydrateReviews(rows: ReviewRow[]): Promise<ReviewRecord[]> {
    if (rows.length === 0) return [];

    const reviewIds = rows.map((r) => r.id);
    const eligibilityIds = rows.map((r) => r.eligibility_id);
    const customerIds = rows.map((r) => r.customer_id);

    const [verificationTypes, profileNames, ratingsMap, responsesMap] =
      await Promise.all([
        this.loadVerificationTypes(eligibilityIds),
        this.loadProfileNames(customerIds),
        this.loadRatingsForReviews(reviewIds),
        this.loadResponsesForReviews(reviewIds),
      ]);

    return rows.map((row) => ({
      id: row.id,
      eligibilityId: row.eligibility_id,
      customerId: row.customer_id,
      businessId: row.business_id,
      overallRating: row.overall_rating,
      comment: row.comment,
      status: row.status,
      publishedAt: row.published_at,
      editedAt: row.edited_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      verificationType: verificationTypes.get(row.eligibility_id) ??
        "paid_invoice",
      ratings: ratingsMap.get(row.id) ?? [],
      response: responsesMap.get(row.id) ?? null,
      reviewerFullName: profileNames.get(row.customer_id) ?? null,
    }));
  }

  async listEligibilities(
    filters: ListEligibilitiesFilters,
  ): Promise<ReviewEligibilityRecord[]> {
    let query = this.adminClient
      .from("review_eligibilities")
      .select(ELIGIBILITY_SELECT)
      .eq("customer_id", filters.customerId)
      .order("created_at", { ascending: false });

    if (filters.isUsed !== undefined) {
      query = query.eq("is_used", filters.isUsed);
    }

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list review eligibilities.", error);
    return ((data ?? []) as EligibilityRow[]).map(toEligibility);
  }

  async findEligibilityById(
    eligibilityId: string,
  ): Promise<ReviewEligibilityRecord | null> {
    const { data, error } = await this.adminClient
      .from("review_eligibilities")
      .select(ELIGIBILITY_SELECT)
      .eq("id", eligibilityId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load review eligibility.", error);
    if (!data) return null;
    return toEligibility(data as EligibilityRow);
  }

  async findEligibilityByInvoiceId(
    invoiceId: string,
  ): Promise<ReviewEligibilityRecord | null> {
    const { data, error } = await this.adminClient
      .from("review_eligibilities")
      .select(ELIGIBILITY_SELECT)
      .eq("invoice_id", invoiceId)
      .maybeSingle();

    if (error) {
      throw new InternalError("Failed to load review eligibility by invoice.", error);
    }
    if (!data) return null;
    return toEligibility(data as EligibilityRow);
  }

  async findEligibilityByAppointmentId(
    appointmentId: string,
  ): Promise<ReviewEligibilityRecord | null> {
    const { data, error } = await this.adminClient
      .from("review_eligibilities")
      .select(ELIGIBILITY_SELECT)
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new InternalError(
        "Failed to load review eligibility by appointment.",
        error,
      );
    }
    if (!data) return null;
    return toEligibility(data as EligibilityRow);
  }

  async ensureEligibility(input: {
    invoiceId?: string | null;
    appointmentId?: string | null;
    actorUserId?: string | null;
    requestId?: string | null;
  }): Promise<string | null> {
    const { data, error } = await this.adminClient.rpc("ensure_review_eligibility", {
      p_invoice_id: input.invoiceId ?? null,
      p_appointment_id: input.appointmentId ?? null,
      p_actor_user_id: input.actorUserId ?? null,
      p_request_id: input.requestId ?? null,
    });

    if (error) {
      const message = error.message ?? "";
      if (message.includes("REVIEW_NOT_ELIGIBLE")) return null;
      mapReviewRpcError(message);
    }

    return (data as string | null) ?? null;
  }

  async createReview(input: {
    eligibilityId: string;
    customerId: string;
    overallRating: number;
    comment?: string | null;
    ratings: DimensionRatingsInput;
    requestId?: string | null;
  }): Promise<string> {
    const { data, error } = await this.adminClient.rpc("create_verified_review", {
      p_eligibility_id: input.eligibilityId,
      p_customer_id: input.customerId,
      p_overall_rating: input.overallRating,
      p_comment: input.comment ?? null,
      p_ratings: input.ratings,
      p_request_id: input.requestId ?? null,
    });

    if (error) mapReviewRpcError(error.message ?? "");
    return data as string;
  }

  async findReviewById(reviewId: string): Promise<ReviewRecord | null> {
    const { data, error } = await this.adminClient
      .from("reviews")
      .select(REVIEW_SELECT)
      .eq("id", reviewId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load review.", error);
    if (!data) return null;

    const [record] = await this.hydrateReviews([data as ReviewRow]);
    return record ?? null;
  }

  async listReviews(
    filters: ListReviewsFilters,
  ): Promise<{ items: ReviewRecord[]; total: number }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const order = sortOrder(filters.sort);

    let query = this.adminClient
      .from("reviews")
      .select(REVIEW_SELECT, { count: "exact" });

    if (filters.customerId) query = query.eq("customer_id", filters.customerId);
    if (filters.businessId) query = query.eq("business_id", filters.businessId);
    if (filters.minRating !== undefined) {
      query = query.gte("overall_rating", filters.minRating);
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    }

    query = query
      .order(order.column, { ascending: order.ascending })
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw new InternalError("Failed to list reviews.", error);

    const items = await this.hydrateReviews((data ?? []) as ReviewRow[]);
    return { items, total: count ?? items.length };
  }

  async updateReview(input: UpdateReviewPersistenceInput): Promise<ReviewRecord> {
    const { data, error } = await this.adminClient
      .from("reviews")
      .update({
        overall_rating: input.overallRating,
        comment: input.comment,
        edited_at: input.editedAt,
      })
      .eq("id", input.reviewId)
      .eq("status", ReviewStatuses.Published)
      .select(REVIEW_SELECT)
      .maybeSingle();

    if (error) throw new InternalError("Failed to update review.", error);
    if (!data) {
      throw new InternalError("Review is not editable.", { reviewId: input.reviewId });
    }

    for (const [dimension, rating] of Object.entries(input.ratings)) {
      const { error: ratingError } = await this.adminClient
        .from("review_ratings")
        .update({ rating })
        .eq("review_id", input.reviewId)
        .eq("dimension", dimension);

      if (ratingError) {
        throw new InternalError("Failed to update review ratings.", ratingError);
      }
    }

    const review = data as ReviewRow;
    const { error: recalcError } = await this.adminClient.rpc(
      "recalculate_business_rating",
      { p_business_id: review.business_id },
    );
    if (recalcError) {
      throw new InternalError("Failed to recalculate business rating.", recalcError);
    }

    const updated = await this.findReviewById(input.reviewId);
    if (!updated) {
      throw new InternalError("Review missing after update.", { reviewId: input.reviewId });
    }
    return updated;
  }

  async createReport(
    input: CreateReportPersistenceInput,
  ): Promise<ReviewReportRecord> {
    const { data, error } = await this.adminClient
      .from("review_reports")
      .insert({
        review_id: input.reviewId,
        reported_by: input.reportedBy,
        reason_code: input.reasonCode,
        details: input.details ?? null,
        status: ReviewReportStatuses.Open,
      })
      .select(REPORT_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") throw new ReviewReportAlreadyOpenError();
      throw new InternalError("Failed to create review report.", error);
    }

    return toReport(data as ReportRow);
  }

  async listReports(
    filters: ListReviewReportsFilters,
  ): Promise<{ items: ReviewReportRecord[]; total: number }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    let query = this.adminClient
      .from("review_reports")
      .select(REPORT_SELECT, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    }

    const { data, error, count } = await query.range(
      offset,
      offset + pageSize - 1,
    );
    if (error) throw new InternalError("Failed to list review reports.", error);

    return {
      items: ((data ?? []) as ReportRow[]).map(toReport),
      total: count ?? 0,
    };
  }

  async findReportById(reportId: string): Promise<ReviewReportRecord | null> {
    const { data, error } = await this.adminClient
      .from("review_reports")
      .select(REPORT_SELECT)
      .eq("id", reportId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load review report.", error);
    if (!data) return null;
    return toReport(data as ReportRow);
  }

  async resolveReport(
    input: ResolveReportPersistenceInput,
  ): Promise<ReviewReportRecord> {
    if (input.reviewModeration) {
      await this.moderateReview(input.reviewModeration);
    }

    const { data, error } = await this.adminClient
      .from("review_reports")
      .update({
        status: input.status,
        resolved_at: new Date().toISOString(),
        resolved_by: input.resolvedBy,
      })
      .eq("id", input.reportId)
      .select(REPORT_SELECT)
      .maybeSingle();

    if (error) throw new InternalError("Failed to resolve review report.", error);
    if (!data) {
      throw new InternalError("Review report not found.", { reportId: input.reportId });
    }

    return toReport(data as ReportRow);
  }

  async moderateReview(
    input: ModerateReviewPersistenceInput,
  ): Promise<ReviewRecord> {
    const patch: Record<string, unknown> = { status: input.newStatus };
    if (input.newStatus === ReviewStatuses.Published) {
      patch.published_at = new Date().toISOString();
    }

    const { data, error } = await this.adminClient
      .from("reviews")
      .update(patch)
      .eq("id", input.reviewId)
      .select(REVIEW_SELECT)
      .maybeSingle();

    if (error) throw new InternalError("Failed to moderate review.", error);
    if (!data) {
      throw new InternalError("Review not found for moderation.", {
        reviewId: input.reviewId,
      });
    }

    const review = data as ReviewRow;

    const { error: eventError } = await this.adminClient
      .from("review_moderation_events")
      .insert({
        review_id: input.reviewId,
        moderator_id: input.moderatorId,
        action: input.action,
        previous_status: input.previousStatus,
        new_status: input.newStatus,
        reason: input.reason ?? null,
        metadata: input.metadata ?? {},
      });

    if (eventError) {
      throw new InternalError("Failed to record moderation event.", eventError);
    }

    const { error: recalcError } = await this.adminClient.rpc(
      "recalculate_business_rating",
      { p_business_id: review.business_id },
    );
    if (recalcError) {
      throw new InternalError("Failed to recalculate business rating.", recalcError);
    }

    const updated = await this.findReviewById(input.reviewId);
    if (!updated) {
      throw new InternalError("Review missing after moderation.", {
        reviewId: input.reviewId,
      });
    }
    return updated;
  }

  async upsertResponse(
    input: UpsertResponsePersistenceInput,
  ): Promise<ReviewRecord> {
    const { error } = await this.adminClient.from("review_responses").insert({
      review_id: input.reviewId,
      business_id: input.businessId,
      responded_by: input.respondedBy,
      response: input.response,
    });

    if (error) {
      if (error.code === "23505") throw new ReviewResponseAlreadyExistsError();
      throw new InternalError("Failed to create review response.", error);
    }

    const updated = await this.findReviewById(input.reviewId);
    if (!updated) {
      throw new InternalError("Review missing after response.", {
        reviewId: input.reviewId,
      });
    }
    return updated;
  }

  async updateResponse(
    input: UpsertResponsePersistenceInput,
  ): Promise<ReviewRecord> {
    const { data, error } = await this.adminClient
      .from("review_responses")
      .update({
        response: input.response,
        responded_by: input.respondedBy,
      })
      .eq("review_id", input.reviewId)
      .eq("business_id", input.businessId)
      .select("id")
      .maybeSingle();

    if (error) throw new InternalError("Failed to update review response.", error);
    if (!data) {
      throw new InternalError("Review response not found.", {
        reviewId: input.reviewId,
      });
    }

    const updated = await this.findReviewById(input.reviewId);
    if (!updated) {
      throw new InternalError("Review missing after response update.", {
        reviewId: input.reviewId,
      });
    }
    return updated;
  }

  async loadEligibilityContext(
    eligibilityId: string,
  ): Promise<{ appointmentId: string | null; invoiceId: string | null } | null> {
    const { data, error } = await this.adminClient
      .from("review_eligibilities")
      .select("appointment_id, invoice_id")
      .eq("id", eligibilityId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load eligibility context.", error);
    if (!data) return null;

    const row = data as { appointment_id: string | null; invoice_id: string | null };
    return {
      appointmentId: row.appointment_id,
      invoiceId: row.invoice_id,
    };
  }
}
