import { AppError, AuthorizationError } from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";

export class ReviewNotFoundError extends AppError {
  constructor(id?: string) {
    super({
      code: ErrorCodes.Review.NotFound,
      message: "Review was not found.",
      status: 404,
      details: id ? { reviewId: id } : null,
    });
    this.name = "ReviewNotFoundError";
  }
}

export class ReviewEligibilityNotFoundError extends AppError {
  constructor(id?: string) {
    super({
      code: ErrorCodes.Review.EligibilityNotFound,
      message: "Review eligibility was not found.",
      status: 404,
      details: id ? { eligibilityId: id } : null,
    });
    this.name = "ReviewEligibilityNotFoundError";
  }
}

export class ReviewAccessDeniedError extends AuthorizationError {
  constructor(message = "You do not have access to this review.") {
    super(message);
    this.name = "ReviewAccessDeniedError";
  }
}

export class ReviewNotEligibleError extends AppError {
  constructor(message = "You are not eligible to leave a review.") {
    super({
      code: ErrorCodes.Review.NotEligible,
      message,
      status: 409,
    });
    this.name = "ReviewNotEligibleError";
  }
}

export class ReviewEligibilityAlreadyUsedError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Review.EligibilityAlreadyUsed,
      message: "This review eligibility has already been used.",
      status: 409,
    });
    this.name = "ReviewEligibilityAlreadyUsedError";
  }
}

export class ReviewAlreadyExistsError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Review.AlreadyExists,
      message: "A review already exists for this eligibility.",
      status: 409,
    });
    this.name = "ReviewAlreadyExistsError";
  }
}

export class ReviewRatingInvalidError extends AppError {
  constructor(message = "Review ratings are invalid.") {
    super({
      code: ErrorCodes.Review.RatingInvalid,
      message,
      status: 422,
      details: null,
    });
    this.name = "ReviewRatingInvalidError";
  }
}

export class ReviewNotEditableError extends AppError {
  constructor(message = "Only published reviews can be edited.") {
    super({
      code: ErrorCodes.Review.NotEditable,
      message,
      status: 409,
    });
    this.name = "ReviewNotEditableError";
  }
}

export class ReviewsDisabledError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Review.Disabled,
      message: "Reviews are disabled for this business.",
      status: 422,
    });
    this.name = "ReviewsDisabledError";
  }
}

export class ReviewSelfReviewDeniedError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Review.SelfReviewDenied,
      message: "Business members cannot review their own business.",
      status: 409,
    });
    this.name = "ReviewSelfReviewDeniedError";
  }
}

export class ReviewInvalidTransitionError extends AppError {
  constructor(message: string, details: unknown = null) {
    super({
      code: ErrorCodes.Review.InvalidTransition,
      message,
      status: 409,
      details,
    });
    this.name = "ReviewInvalidTransitionError";
  }
}

export class ReviewReportNotFoundError extends AppError {
  constructor(id?: string) {
    super({
      code: ErrorCodes.Review.ReportNotFound,
      message: "Review report was not found.",
      status: 404,
      details: id ? { reportId: id } : null,
    });
    this.name = "ReviewReportNotFoundError";
  }
}

export class ReviewReportAlreadyOpenError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Review.ReportAlreadyOpen,
      message: "You already have an open report for this review.",
      status: 409,
    });
    this.name = "ReviewReportAlreadyOpenError";
  }
}

export class ReviewResponseNotFoundError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Review.ResponseNotFound,
      message: "Business response was not found.",
      status: 404,
    });
    this.name = "ReviewResponseNotFoundError";
  }
}

export class ReviewResponseAlreadyExistsError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Review.ResponseAlreadyExists,
      message: "A business response already exists for this review.",
      status: 409,
    });
    this.name = "ReviewResponseAlreadyExistsError";
  }
}

export function mapReviewRpcError(message: string): never {
  if (message.includes("REVIEW_ELIGIBILITY_NOT_FOUND")) {
    throw new ReviewEligibilityNotFoundError();
  }
  if (message.includes("REVIEW_NOT_ELIGIBLE")) {
    throw new ReviewNotEligibleError();
  }
  if (message.includes("REVIEW_ELIGIBILITY_ALREADY_USED")) {
    throw new ReviewEligibilityAlreadyUsedError();
  }
  if (message.includes("REVIEW_ALREADY_EXISTS")) {
    throw new ReviewAlreadyExistsError();
  }
  if (message.includes("REVIEW_RATING_INVALID")) {
    throw new ReviewRatingInvalidError();
  }
  if (message.includes("REVIEW_REPORT_ALREADY_OPEN")) {
    throw new ReviewReportAlreadyOpenError();
  }
  if (message.includes("REVIEW_RESPONSE_ALREADY_EXISTS")) {
    throw new ReviewResponseAlreadyExistsError();
  }
  throw new AppError({
    code: ErrorCodes.Internal.Unexpected,
    message: message || "Review operation failed.",
    status: 500,
  });
}
