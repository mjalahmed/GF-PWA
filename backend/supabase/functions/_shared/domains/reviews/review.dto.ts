import type {
  ReviewRatingDimension,
  ReviewReportReason,
  ReviewStatus,
  ReviewVerificationType,
} from "../../core/constants/statuses.ts";

export type ReviewRatingDto = {
  dimension: ReviewRatingDimension;
  rating: number;
};

export type ReviewResponseDto = {
  id: string;
  response: string;
  respondedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicReviewDto = {
  id: string;
  businessId: string;
  overallRating: number;
  comment: string | null;
  ratings: ReviewRatingDto[];
  verified: true;
  verificationType: ReviewVerificationType;
  reviewerDisplayName: string;
  publishedAt: string | null;
  editedAt: string | null;
  createdAt: string;
  response?: ReviewResponseDto | null;
};

export type CustomerReviewDto = PublicReviewDto & {
  eligibilityId: string;
  customerId: string;
  status: ReviewStatus;
  appointmentId?: string | null;
  invoiceId?: string | null;
};

export type BusinessReviewDto = CustomerReviewDto & {
  response?: ReviewResponseDto | null;
};

export type AdminReviewDto = BusinessReviewDto;

export type ReviewEligibilityDto = {
  id: string;
  businessId: string;
  appointmentId: string | null;
  invoiceId: string | null;
  verificationType: ReviewVerificationType;
  isUsed: boolean;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type CreateReviewRequestDto = {
  eligibilityId: string;
  overallRating: number;
  comment?: string | null;
  ratings: Record<ReviewRatingDimension, number>;
};

export type UpdateReviewRequestDto = {
  overallRating: number;
  comment?: string | null;
  ratings: Record<ReviewRatingDimension, number>;
};

export type ReportReviewRequestDto = {
  reasonCode: ReviewReportReason;
  details?: string | null;
};

export type ReviewResponseRequestDto = {
  response: string;
};

export type ModerateReviewRequestDto = {
  reason?: string | null;
};

export type ResolveReportActionRequestDto = {
  action: "hide" | "remove" | "flag";
  reason?: string | null;
};

export type ReviewReportDto = {
  id: string;
  reviewId: string;
  reportedBy: string;
  reasonCode: ReviewReportReason;
  details: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};
