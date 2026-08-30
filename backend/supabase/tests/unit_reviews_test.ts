/**
 * Phase 9 verified reviews unit tests.
 */
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ApiContract } from "../functions/_shared/contracts/api-contract.ts";
import { Permissions } from "../functions/_shared/core/constants/permissions.ts";
import {
  ReviewModerationActions,
  ReviewRatingDimensions,
  ReviewReportReasons,
  ReviewReportStatuses,
  ReviewStatuses,
  ReviewVerificationTypes,
} from "../functions/_shared/core/constants/statuses.ts";
import { ErrorCodes } from "../functions/_shared/core/constants/error-codes.ts";
import {
  permissionsForMembershipRole,
} from "../functions/_shared/core/auth/business-authorization.middleware.ts";
import {
  formatReviewerDisplayName,
  ReviewMapper,
} from "../functions/_shared/domains/reviews/review.mapper.ts";
import {
  assertModerationTransition,
  canCustomerEditReview,
  isEligibilityExpired,
  isEligibilityUsable,
  REVIEW_DIMENSION_VALUES,
  REVIEW_MODERATION_TRANSITIONS,
  targetStatusForModerationAction,
  validateDimensionRatings,
  validateOverallRating,
} from "../functions/_shared/domains/reviews/review.transitions.ts";
import type { ReviewRecord } from "../functions/_shared/domains/reviews/review.types.ts";
import {
  ReviewInvalidTransitionError,
  ReviewNotEligibleError,
  ReviewRatingInvalidError,
} from "../functions/_shared/domains/reviews/review.errors.ts";

Deno.test("ApiContract exposes Phase 9 review routes", () => {
  assertEquals(ApiContract.routes.reviewEligibilities, "/review-eligibilities");
  assertEquals(ApiContract.routes.reviews, "/reviews");
  assertEquals(
    ApiContract.routes.businessReviews,
    "/businesses/:businessId/reviews",
  );
  assertEquals(ApiContract.routes.adminReviews, "/admin/reviews");
  assertEquals(
    ApiContract.routes.adminReviewHide,
    "/admin/reviews/:reviewId/hide",
  );
  assertEquals(
    ApiContract.routes.adminReviewReports,
    "/admin/review-reports",
  );
});

Deno.test("Phase 9 review permissions exist", () => {
  assertEquals(Permissions.Review.Create, "review.create");
  assertEquals(Permissions.Review.EligibilityReadOwn, "review.eligibility.read_own");
  assertEquals(Permissions.Review.Moderate, "review.moderate");
  assertEquals(Permissions.BusinessReview.Read, "business.review.read");
  assertEquals(Permissions.BusinessReview.Respond, "business.review.respond");
});

Deno.test("business staff can read reviews; managers can respond", () => {
  const staff = permissionsForMembershipRole("service_advisor");
  const manager = permissionsForMembershipRole("manager");
  assertEquals(staff.includes(Permissions.BusinessReview.Read), true);
  assertEquals(staff.includes(Permissions.BusinessReview.Respond), false);
  assertEquals(manager.includes(Permissions.BusinessReview.Respond), true);
});

Deno.test("Review status and dimension registries", () => {
  assertEquals(ReviewStatuses.Flagged, "flagged");
  assertEquals(
    ReviewVerificationTypes.CompletedAppointmentPaidInvoice,
    "completed_appointment_paid_invoice",
  );
  assertEquals(ReviewRatingDimensions.WorkQuality, "work_quality");
  assertEquals(ReviewReportReasons.Spam, "spam");
  assertEquals(ReviewReportStatuses.Open, "open");
  assertEquals(ReviewModerationActions.DismissReport, "dismiss_report");
  assertEquals(REVIEW_DIMENSION_VALUES.length, 5);
});

Deno.test("ErrorCodes review registry", () => {
  assertEquals(ErrorCodes.Review.NotEligible, "REVIEW_NOT_ELIGIBLE");
  assertEquals(ErrorCodes.Review.RatingInvalid, "REVIEW_RATING_INVALID");
  assertEquals(ErrorCodes.Review.SelfReviewDenied, "REVIEW_SELF_REVIEW_DENIED");
  assertEquals(ErrorCodes.Review.InvalidTransition, "INVALID_REVIEW_TRANSITION");
});

Deno.test("formatReviewerDisplayName masks privacy", () => {
  assertEquals(formatReviewerDisplayName("Jane Doe"), "Jane D.");
  assertEquals(formatReviewerDisplayName("Madonna"), "Madonna");
  assertEquals(formatReviewerDisplayName(null), "Verified Customer");
  assertEquals(formatReviewerDisplayName("  "), "Verified Customer");
});

Deno.test("eligibility helpers enforce usable window", () => {
  assertEquals(isEligibilityExpired(null), false);
  assertEquals(
    isEligibilityExpired(new Date(Date.now() - 60_000).toISOString()),
    true,
  );
  assertEquals(
    isEligibilityUsable({ isUsed: false, expiresAt: null }),
    true,
  );
  assertEquals(
    isEligibilityUsable({ isUsed: true, expiresAt: null }),
    false,
  );
});

Deno.test("validateOverallRating and validateDimensionRatings", () => {
  validateOverallRating(5);
  assertThrows(() => validateOverallRating(0), ReviewRatingInvalidError);
  assertThrows(() => validateOverallRating(6), ReviewRatingInvalidError);

  validateDimensionRatings({
    work_quality: 5,
    pricing_transparency: 4,
    timeliness: 3,
    customer_service: 5,
    overall_experience: 4,
  });

  assertThrows(
    () => validateDimensionRatings({ work_quality: 5 }),
    ReviewRatingInvalidError,
  );
  assertThrows(
    () =>
      validateDimensionRatings({
        work_quality: 0,
        pricing_transparency: 4,
        timeliness: 3,
        customer_service: 5,
        overall_experience: 4,
      }),
    ReviewRatingInvalidError,
  );
});

Deno.test("moderation transitions and action targets", () => {
  assertEquals(
    targetStatusForModerationAction(ReviewModerationActions.Hide),
    ReviewStatuses.Hidden,
  );
  assertEquals(
    targetStatusForModerationAction(ReviewModerationActions.Restore),
    ReviewStatuses.Published,
  );
  assertEquals(
    targetStatusForModerationAction(ReviewModerationActions.DismissReport),
    null,
  );

  assertModerationTransition(ReviewStatuses.Published, ReviewStatuses.Hidden);
  assertThrows(
    () => assertModerationTransition(ReviewStatuses.Removed, ReviewStatuses.Hidden),
    ReviewInvalidTransitionError,
  );
  assertEquals(
    REVIEW_MODERATION_TRANSITIONS[ReviewStatuses.Published]?.includes(
      ReviewStatuses.Flagged,
    ),
    true,
  );
});

Deno.test("only published reviews are customer-editable", () => {
  assertEquals(canCustomerEditReview(ReviewStatuses.Published), true);
  assertEquals(canCustomerEditReview(ReviewStatuses.Hidden), false);
});

Deno.test("ReviewMapper public DTO hides internals", () => {
  const record: ReviewRecord = {
    id: "11111111-1111-4111-8111-111111111111",
    eligibilityId: "22222222-2222-4222-8222-222222222222",
    customerId: "33333333-3333-4333-8333-333333333333",
    businessId: "44444444-4444-4444-8444-444444444444",
    overallRating: 5,
    comment: "Great service",
    status: ReviewStatuses.Published,
    publishedAt: "2026-01-01T00:00:00.000Z",
    editedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    verificationType: ReviewVerificationTypes.PaidInvoice,
    ratings: REVIEW_DIMENSION_VALUES.map((dimension, index) => ({
      id: `${index}`,
      reviewId: "11111111-1111-4111-8111-111111111111",
      dimension,
      rating: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
    })),
    reviewerFullName: "Alex Smith",
  };

  const dto = ReviewMapper.toPublicDto(record);
  assertEquals(dto.verified, true);
  assertEquals(dto.reviewerDisplayName, "Alex S.");
  assertEquals(dto.ratings.length, 5);
  assertEquals("customerId" in dto, false);
  assertEquals("eligibilityId" in dto, false);
});

Deno.test("ReviewNotEligibleError uses canonical code", () => {
  const err = new ReviewNotEligibleError();
  assertEquals(err.code, ErrorCodes.Review.NotEligible);
});
