import {
  ReviewModerationActions,
  ReviewRatingDimensions,
  ReviewStatuses,
  type ReviewModerationAction,
  type ReviewRatingDimension,
  type ReviewStatus,
} from "../../core/constants/statuses.ts";
import {
  ReviewInvalidTransitionError,
  ReviewRatingInvalidError,
} from "./review.errors.ts";
import type { DimensionRatingsInput } from "./review.types.ts";

export const REVIEW_DIMENSION_VALUES = Object.values(
  ReviewRatingDimensions,
) as ReviewRatingDimension[];

/** Allowed moderation transitions: from -> set of to */
export const REVIEW_MODERATION_TRANSITIONS: Partial<
  Record<ReviewStatus, readonly ReviewStatus[]>
> = {
  [ReviewStatuses.Published]: [
    ReviewStatuses.Hidden,
    ReviewStatuses.Flagged,
    ReviewStatuses.Removed,
  ],
  [ReviewStatuses.Hidden]: [
    ReviewStatuses.Published,
    ReviewStatuses.Removed,
  ],
  [ReviewStatuses.Flagged]: [
    ReviewStatuses.Published,
    ReviewStatuses.Hidden,
    ReviewStatuses.Removed,
  ],
  [ReviewStatuses.Pending]: [ReviewStatuses.Published],
  [ReviewStatuses.Removed]: [ReviewStatuses.Published],
};

export const MODERATION_ACTION_TARGETS: Record<
  Extract<ReviewModerationAction, "hide" | "restore" | "remove" | "flag">,
  ReviewStatus
> = {
  [ReviewModerationActions.Hide]: ReviewStatuses.Hidden,
  [ReviewModerationActions.Restore]: ReviewStatuses.Published,
  [ReviewModerationActions.Remove]: ReviewStatuses.Removed,
  [ReviewModerationActions.Flag]: ReviewStatuses.Flagged,
};

export function assertModerationTransition(
  from: ReviewStatus,
  to: ReviewStatus,
): void {
  const allowed = REVIEW_MODERATION_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ReviewInvalidTransitionError(
      `Cannot transition review from '${from}' to '${to}'.`,
      { from, to },
    );
  }
}

export function targetStatusForModerationAction(
  action: ReviewModerationAction,
): ReviewStatus | null {
  if (action === ReviewModerationActions.DismissReport) return null;
  return MODERATION_ACTION_TARGETS[
    action as keyof typeof MODERATION_ACTION_TARGETS
  ] ?? null;
}

export function isEligibilityExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

export function isEligibilityUsable(input: {
  isUsed: boolean;
  expiresAt: string | null;
}): boolean {
  return !input.isUsed && !isEligibilityExpired(input.expiresAt);
}

export function validateOverallRating(rating: number): void {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ReviewRatingInvalidError(
      "Overall rating must be an integer between 1 and 5.",
    );
  }
}

export function validateDimensionRatings(
  ratings: Partial<Record<string, number>>,
): asserts ratings is DimensionRatingsInput {
  for (const dimension of REVIEW_DIMENSION_VALUES) {
    const value = ratings[dimension];
    if (value === undefined || value === null) {
      throw new ReviewRatingInvalidError(
        `Missing rating for dimension '${dimension}'.`,
      );
    }
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new ReviewRatingInvalidError(
        `Rating for '${dimension}' must be an integer between 1 and 5.`,
      );
    }
  }
}

export function canCustomerEditReview(status: ReviewStatus): boolean {
  return status === ReviewStatuses.Published;
}
