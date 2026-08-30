import type {
  CreateReportPersistenceInput,
  ListEligibilitiesFilters,
  ListReviewReportsFilters,
  ListReviewsFilters,
  ModerateReviewPersistenceInput,
  ResolveReportPersistenceInput,
  ReviewEligibilityRecord,
  ReviewRecord,
  ReviewReportRecord,
  UpdateReviewPersistenceInput,
  UpsertResponsePersistenceInput,
  DimensionRatingsInput,
} from "./review.types.ts";

export type ListReviewsResult = {
  items: ReviewRecord[];
  total: number;
};

export type ListReportsResult = {
  items: ReviewReportRecord[];
  total: number;
};

export interface ReviewRepository {
  listEligibilities(filters: ListEligibilitiesFilters): Promise<ReviewEligibilityRecord[]>;
  findEligibilityById(eligibilityId: string): Promise<ReviewEligibilityRecord | null>;
  findEligibilityByInvoiceId(invoiceId: string): Promise<ReviewEligibilityRecord | null>;
  findEligibilityByAppointmentId(
    appointmentId: string,
  ): Promise<ReviewEligibilityRecord | null>;
  ensureEligibility(input: {
    invoiceId?: string | null;
    appointmentId?: string | null;
    actorUserId?: string | null;
    requestId?: string | null;
  }): Promise<string | null>;
  createReview(input: {
    eligibilityId: string;
    customerId: string;
    overallRating: number;
    comment?: string | null;
    ratings: DimensionRatingsInput;
    requestId?: string | null;
  }): Promise<string>;
  findReviewById(reviewId: string): Promise<ReviewRecord | null>;
  listReviews(filters: ListReviewsFilters): Promise<ListReviewsResult>;
  updateReview(input: UpdateReviewPersistenceInput): Promise<ReviewRecord>;
  createReport(input: CreateReportPersistenceInput): Promise<ReviewReportRecord>;
  listReports(filters: ListReviewReportsFilters): Promise<ListReportsResult>;
  findReportById(reportId: string): Promise<ReviewReportRecord | null>;
  resolveReport(input: ResolveReportPersistenceInput): Promise<ReviewReportRecord>;
  moderateReview(input: ModerateReviewPersistenceInput): Promise<ReviewRecord>;
  upsertResponse(input: UpsertResponsePersistenceInput): Promise<ReviewRecord>;
  updateResponse(input: UpsertResponsePersistenceInput): Promise<ReviewRecord>;
  loadEligibilityContext(
    eligibilityId: string,
  ): Promise<{ appointmentId: string | null; invoiceId: string | null } | null>;
}
