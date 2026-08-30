import type {
  ReviewModerationAction,
  ReviewRatingDimension,
  ReviewReportReason,
  ReviewReportStatus,
  ReviewStatus,
  ReviewVerificationType,
} from "../../core/constants/statuses.ts";

export type ReviewEligibilityRecord = {
  id: string;
  customerId: string;
  businessId: string;
  appointmentId: string | null;
  invoiceId: string | null;
  verificationType: ReviewVerificationType;
  isUsed: boolean;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewRatingRecord = {
  id: string;
  reviewId: string;
  dimension: ReviewRatingDimension;
  rating: number;
  createdAt: string;
};

export type ReviewResponseRecord = {
  id: string;
  reviewId: string;
  businessId: string;
  respondedBy: string;
  response: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewRecord = {
  id: string;
  eligibilityId: string;
  customerId: string;
  businessId: string;
  overallRating: number;
  comment: string | null;
  status: ReviewStatus;
  publishedAt: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
  verificationType: ReviewVerificationType;
  ratings: ReviewRatingRecord[];
  response?: ReviewResponseRecord | null;
  reviewerFullName?: string | null;
};

export type ReviewReportRecord = {
  id: string;
  reviewId: string;
  reportedBy: string;
  reasonCode: ReviewReportReason;
  details: string | null;
  status: ReviewReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type ReviewModerationEventRecord = {
  id: string;
  reviewId: string;
  moderatorId: string;
  action: ReviewModerationAction;
  previousStatus: ReviewStatus | null;
  newStatus: ReviewStatus | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type DimensionRatingsInput = Record<ReviewRatingDimension, number>;

export type ListEligibilitiesFilters = {
  customerId: string;
  isUsed?: boolean;
};

export type ListReviewsFilters = {
  customerId?: string;
  businessId?: string;
  status?: ReviewStatus | ReviewStatus[];
  minRating?: number;
  sort?: "newest" | "highest" | "lowest";
  page?: number;
  pageSize?: number;
};

export type ListReviewReportsFilters = {
  status?: ReviewReportStatus | ReviewReportStatus[];
  page?: number;
  pageSize?: number;
};

export type UpdateReviewPersistenceInput = {
  reviewId: string;
  overallRating: number;
  comment: string | null;
  ratings: DimensionRatingsInput;
  editedAt: string;
};

export type ModerateReviewPersistenceInput = {
  reviewId: string;
  moderatorId: string;
  action: ReviewModerationAction;
  previousStatus: ReviewStatus;
  newStatus: ReviewStatus;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export type CreateReportPersistenceInput = {
  reviewId: string;
  reportedBy: string;
  reasonCode: ReviewReportReason;
  details?: string | null;
};

export type ResolveReportPersistenceInput = {
  reportId: string;
  resolvedBy: string;
  status: ReviewReportStatus;
  moderationAction?: ReviewModerationAction;
  reviewModeration?: ModerateReviewPersistenceInput;
};

export type UpsertResponsePersistenceInput = {
  reviewId: string;
  businessId: string;
  respondedBy: string;
  response: string;
};
