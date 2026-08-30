export const ErrorCodes = {
  Authentication: {
    HeaderMissing: "AUTH_HEADER_MISSING",
    SchemeInvalid: "AUTH_SCHEME_INVALID",
    TokenInvalid: "AUTH_TOKEN_INVALID",
    TokenExpired: "AUTH_TOKEN_EXPIRED",
    Required: "AUTH_REQUIRED",
  },
  Authorization: {
    PermissionDenied: "PERMISSION_DENIED",
  },
  Validation: {
    InvalidRequest: "VALIDATION_ERROR",
    UnsupportedMediaType: "UNSUPPORTED_MEDIA_TYPE",
  },
  Resource: {
    NotFound: "RESOURCE_NOT_FOUND",
    Conflict: "CONFLICT",
    IdempotencyConflict: "IDEMPOTENCY_CONFLICT",
    InvalidStateTransition: "INVALID_STATE_TRANSITION",
  },
  Quotation: {
    NotFound: "QUOTATION_NOT_FOUND",
    NotEditable: "QUOTATION_NOT_EDITABLE",
    AlreadyAccepted: "QUOTATION_ALREADY_ACCEPTED",
    Expired: "QUOTATION_EXPIRED",
    InvalidTransition: "INVALID_QUOTATION_TRANSITION",
    ItemInvalid: "QUOTATION_ITEM_INVALID",
    TotalInvalid: "QUOTATION_TOTAL_INVALID",
    RevisionConflict: "QUOTATION_REVISION_CONFLICT",
  },
  Invoice: {
    NotFound: "INVOICE_NOT_FOUND",
    NotEditable: "INVOICE_NOT_EDITABLE",
    AlreadyPaid: "INVOICE_ALREADY_PAID",
    NotPayable: "INVOICE_NOT_PAYABLE",
    ApprovalRequired: "INVOICE_APPROVAL_REQUIRED",
    TotalInvalid: "INVOICE_TOTAL_INVALID",
    AlreadyCreatedFromQuotation: "INVOICE_ALREADY_CREATED_FROM_QUOTATION",
    InvalidTransition: "INVALID_INVOICE_TRANSITION",
    ItemInvalid: "INVOICE_ITEM_INVALID",
  },
  Payment: {
    NotFound: "PAYMENT_NOT_FOUND",
    AmountInvalid: "PAYMENT_AMOUNT_INVALID",
    Overpayment: "PAYMENT_OVERPAYMENT",
    AlreadyProcessed: "PAYMENT_ALREADY_PROCESSED",
    MethodNotEnabled: "PAYMENT_METHOD_NOT_ENABLED",
  },
  Dispute: {
    NotFound: "DISPUTE_NOT_FOUND",
    AccessDenied: "DISPUTE_ACCESS_DENIED",
    AlreadyExists: "DISPUTE_ALREADY_EXISTS",
    WindowExpired: "DISPUTE_WINDOW_EXPIRED",
    InvalidSource: "DISPUTE_INVALID_SOURCE",
    InvalidTransition: "INVALID_DISPUTE_TRANSITION",
    NotMessageable: "DISPUTE_NOT_MESSAGEABLE",
    ReasonRequired: "DISPUTE_REASON_REQUIRED",
    ResolutionRequired: "DISPUTE_RESOLUTION_REQUIRED",
    EvidenceNotFound: "DISPUTE_EVIDENCE_NOT_FOUND",
    EvidenceInvalid: "DISPUTE_EVIDENCE_INVALID",
    WithdrawNotAllowed: "DISPUTE_WITHDRAW_NOT_ALLOWED",
  },
  Review: {
    NotFound: "REVIEW_NOT_FOUND",
    NotEligible: "REVIEW_NOT_ELIGIBLE",
    EligibilityNotFound: "REVIEW_ELIGIBILITY_NOT_FOUND",
    EligibilityAlreadyUsed: "REVIEW_ELIGIBILITY_ALREADY_USED",
    AlreadyExists: "REVIEW_ALREADY_EXISTS",
    RatingInvalid: "REVIEW_RATING_INVALID",
    NotEditable: "REVIEW_NOT_EDITABLE",
    Disabled: "REVIEW_DISABLED",
    SelfReviewDenied: "REVIEW_SELF_REVIEW_DENIED",
    InvalidTransition: "INVALID_REVIEW_TRANSITION",
    ReportNotFound: "REVIEW_REPORT_NOT_FOUND",
    ReportAlreadyOpen: "REVIEW_REPORT_ALREADY_OPEN",
    ResponseNotFound: "REVIEW_RESPONSE_NOT_FOUND",
    ResponseAlreadyExists: "REVIEW_RESPONSE_ALREADY_EXISTS",
  },
  RateLimit: {
    Limited: "RATE_LIMITED",
  },
  Internal: {
    Unexpected: "INTERNAL_ERROR",
    ServiceUnavailable: "SERVICE_UNAVAILABLE",
    Configuration: "CONFIGURATION_ERROR",
  },
} as const;

type NestedValues<T> = T extends string ? T
  : T extends Record<string, infer U> ? NestedValues<U>
  : never;

export type ErrorCode = NestedValues<typeof ErrorCodes>;

export function flattenErrorCodes(
  tree: Record<string, unknown> = ErrorCodes as unknown as Record<string, unknown>,
): string[] {
  const out: string[] = [];
  for (const value of Object.values(tree)) {
    if (typeof value === "string") out.push(value);
    else if (value && typeof value === "object") {
      out.push(...flattenErrorCodes(value as Record<string, unknown>));
    }
  }
  return out;
}

export const ERROR_CODE_VALUES: ErrorCode[] = flattenErrorCodes() as ErrorCode[];

export function assertUniqueErrorCodes(): void {
  const values = flattenErrorCodes();
  if (new Set(values).size !== values.length) {
    throw new Error("Duplicate error-code registry values detected.");
  }
}

/** Flat aliases for gradual migration / OpenAPI listing */
export const ErrorCodeFlat = {
  AUTH_HEADER_MISSING: ErrorCodes.Authentication.HeaderMissing,
  AUTH_SCHEME_INVALID: ErrorCodes.Authentication.SchemeInvalid,
  AUTH_TOKEN_INVALID: ErrorCodes.Authentication.TokenInvalid,
  AUTH_TOKEN_EXPIRED: ErrorCodes.Authentication.TokenExpired,
  AUTH_REQUIRED: ErrorCodes.Authentication.Required,
  PERMISSION_DENIED: ErrorCodes.Authorization.PermissionDenied,
  VALIDATION_ERROR: ErrorCodes.Validation.InvalidRequest,
  UNSUPPORTED_MEDIA_TYPE: ErrorCodes.Validation.UnsupportedMediaType,
  RESOURCE_NOT_FOUND: ErrorCodes.Resource.NotFound,
  CONFLICT: ErrorCodes.Resource.Conflict,
  IDEMPOTENCY_CONFLICT: ErrorCodes.Resource.IdempotencyConflict,
  INVALID_STATE_TRANSITION: ErrorCodes.Resource.InvalidStateTransition,
  QUOTATION_NOT_FOUND: ErrorCodes.Quotation.NotFound,
  QUOTATION_NOT_EDITABLE: ErrorCodes.Quotation.NotEditable,
  QUOTATION_ALREADY_ACCEPTED: ErrorCodes.Quotation.AlreadyAccepted,
  QUOTATION_EXPIRED: ErrorCodes.Quotation.Expired,
  INVALID_QUOTATION_TRANSITION: ErrorCodes.Quotation.InvalidTransition,
  QUOTATION_ITEM_INVALID: ErrorCodes.Quotation.ItemInvalid,
  QUOTATION_TOTAL_INVALID: ErrorCodes.Quotation.TotalInvalid,
  QUOTATION_REVISION_CONFLICT: ErrorCodes.Quotation.RevisionConflict,
  INVOICE_NOT_FOUND: ErrorCodes.Invoice.NotFound,
  INVOICE_NOT_EDITABLE: ErrorCodes.Invoice.NotEditable,
  INVOICE_ALREADY_PAID: ErrorCodes.Invoice.AlreadyPaid,
  INVOICE_NOT_PAYABLE: ErrorCodes.Invoice.NotPayable,
  INVOICE_APPROVAL_REQUIRED: ErrorCodes.Invoice.ApprovalRequired,
  INVOICE_TOTAL_INVALID: ErrorCodes.Invoice.TotalInvalid,
  INVOICE_ALREADY_CREATED_FROM_QUOTATION:
    ErrorCodes.Invoice.AlreadyCreatedFromQuotation,
  INVALID_INVOICE_TRANSITION: ErrorCodes.Invoice.InvalidTransition,
  INVOICE_ITEM_INVALID: ErrorCodes.Invoice.ItemInvalid,
  PAYMENT_NOT_FOUND: ErrorCodes.Payment.NotFound,
  PAYMENT_AMOUNT_INVALID: ErrorCodes.Payment.AmountInvalid,
  PAYMENT_OVERPAYMENT: ErrorCodes.Payment.Overpayment,
  PAYMENT_ALREADY_PROCESSED: ErrorCodes.Payment.AlreadyProcessed,
  PAYMENT_METHOD_NOT_ENABLED: ErrorCodes.Payment.MethodNotEnabled,
  DISPUTE_NOT_FOUND: ErrorCodes.Dispute.NotFound,
  DISPUTE_ACCESS_DENIED: ErrorCodes.Dispute.AccessDenied,
  DISPUTE_ALREADY_EXISTS: ErrorCodes.Dispute.AlreadyExists,
  DISPUTE_WINDOW_EXPIRED: ErrorCodes.Dispute.WindowExpired,
  DISPUTE_INVALID_SOURCE: ErrorCodes.Dispute.InvalidSource,
  INVALID_DISPUTE_TRANSITION: ErrorCodes.Dispute.InvalidTransition,
  DISPUTE_NOT_MESSAGEABLE: ErrorCodes.Dispute.NotMessageable,
  DISPUTE_REASON_REQUIRED: ErrorCodes.Dispute.ReasonRequired,
  DISPUTE_RESOLUTION_REQUIRED: ErrorCodes.Dispute.ResolutionRequired,
  DISPUTE_EVIDENCE_NOT_FOUND: ErrorCodes.Dispute.EvidenceNotFound,
  DISPUTE_EVIDENCE_INVALID: ErrorCodes.Dispute.EvidenceInvalid,
  DISPUTE_WITHDRAW_NOT_ALLOWED: ErrorCodes.Dispute.WithdrawNotAllowed,
  REVIEW_NOT_FOUND: ErrorCodes.Review.NotFound,
  REVIEW_NOT_ELIGIBLE: ErrorCodes.Review.NotEligible,
  REVIEW_ELIGIBILITY_NOT_FOUND: ErrorCodes.Review.EligibilityNotFound,
  REVIEW_ELIGIBILITY_ALREADY_USED: ErrorCodes.Review.EligibilityAlreadyUsed,
  REVIEW_ALREADY_EXISTS: ErrorCodes.Review.AlreadyExists,
  REVIEW_RATING_INVALID: ErrorCodes.Review.RatingInvalid,
  REVIEW_NOT_EDITABLE: ErrorCodes.Review.NotEditable,
  REVIEW_DISABLED: ErrorCodes.Review.Disabled,
  REVIEW_SELF_REVIEW_DENIED: ErrorCodes.Review.SelfReviewDenied,
  INVALID_REVIEW_TRANSITION: ErrorCodes.Review.InvalidTransition,
  REVIEW_REPORT_NOT_FOUND: ErrorCodes.Review.ReportNotFound,
  REVIEW_REPORT_ALREADY_OPEN: ErrorCodes.Review.ReportAlreadyOpen,
  REVIEW_RESPONSE_NOT_FOUND: ErrorCodes.Review.ResponseNotFound,
  REVIEW_RESPONSE_ALREADY_EXISTS: ErrorCodes.Review.ResponseAlreadyExists,
  RATE_LIMITED: ErrorCodes.RateLimit.Limited,
  INTERNAL_ERROR: ErrorCodes.Internal.Unexpected,
  SERVICE_UNAVAILABLE: ErrorCodes.Internal.ServiceUnavailable,
  CONFIGURATION_ERROR: ErrorCodes.Internal.Configuration,
} as const;
