/** Implemented — matches public.user_status */
export const UserStatuses = {
  Active: "active",
  Suspended: "suspended",
  Blocked: "blocked",
  PendingDeletion: "pending_deletion",
} as const;

export type UserStatus = (typeof UserStatuses)[keyof typeof UserStatuses];

/**
 * Domain status registries.
 * User + business-onboarding statuses are implemented in PostgreSQL.
 * Appointment statuses are implemented in Phase 6.
 * Invoice/payment statuses are implemented in Phase 8.
 * Review statuses are implemented in Phase 9.
 * Dispute statuses remain definitions only until later phases.
 */
export const BusinessStatuses = {
  Draft: "draft",
  PendingReview: "pending_review",
  Active: "active",
  Suspended: "suspended",
  Rejected: "rejected",
  Closed: "closed",
} as const;

export type BusinessStatus = (typeof BusinessStatuses)[keyof typeof BusinessStatuses];

/** Implemented — matches public.business_verification_status */
export const BusinessVerificationStatuses = {
  Unverified: "unverified",
  DocumentsPending: "documents_pending",
  UnderReview: "under_review",
  Verified: "verified",
  Rejected: "rejected",
  Expired: "expired",
} as const;

export type BusinessVerificationStatus =
  (typeof BusinessVerificationStatuses)[keyof typeof BusinessVerificationStatuses];

/** Implemented — matches public.business_application_status */
export const BusinessApplicationStatuses = {
  Draft: "draft",
  Submitted: "submitted",
  UnderReview: "under_review",
  ChangesRequested: "changes_requested",
  Approved: "approved",
  Rejected: "rejected",
  Withdrawn: "withdrawn",
} as const;

export type BusinessApplicationStatus =
  (typeof BusinessApplicationStatuses)[keyof typeof BusinessApplicationStatuses];

export const MembershipStatuses = {
  Invited: "invited",
  Active: "active",
  Suspended: "suspended",
  Removed: "removed",
} as const;

export type MembershipStatus =
  (typeof MembershipStatuses)[keyof typeof MembershipStatuses];

/** Implemented — matches public.business_membership_role */
export const MembershipRoles = {
  Owner: "owner",
  Manager: "manager",
  ServiceAdvisor: "service_advisor",
  Mechanic: "mechanic",
  Cashier: "cashier",
  Receptionist: "receptionist",
  Staff: "staff",
} as const;

export type MembershipRole =
  (typeof MembershipRoles)[keyof typeof MembershipRoles];

export const InvitationStatuses = {
  Pending: "pending",
  Accepted: "accepted",
  Expired: "expired",
  Revoked: "revoked",
} as const;

export type InvitationStatus =
  (typeof InvitationStatuses)[keyof typeof InvitationStatuses];

/** Implemented — matches public.appointment_status */
export const AppointmentStatuses = {
  Requested: "requested",
  Confirmed: "confirmed",
  Rejected: "rejected",
  CustomerArrived: "customer_arrived",
  InProgress: "in_progress",
  Completed: "completed",
  CancelledByCustomer: "cancelled_by_customer",
  CancelledByBusiness: "cancelled_by_business",
  NoShow: "no_show",
  Expired: "expired",
} as const;

export type AppointmentStatus =
  (typeof AppointmentStatuses)[keyof typeof AppointmentStatuses];

export const AppointmentTerminalStatuses: readonly AppointmentStatus[] = [
  AppointmentStatuses.Rejected,
  AppointmentStatuses.Completed,
  AppointmentStatuses.CancelledByCustomer,
  AppointmentStatuses.CancelledByBusiness,
  AppointmentStatuses.NoShow,
  AppointmentStatuses.Expired,
] as const;

/** Implemented — matches public.quotation_status */
export const QuotationStatuses = {
  Draft: "draft",
  Issued: "issued",
  Viewed: "viewed",
  Accepted: "accepted",
  Rejected: "rejected",
  Expired: "expired",
  Cancelled: "cancelled",
  ConvertedToInvoice: "converted_to_invoice",
} as const;

export type QuotationStatus = (typeof QuotationStatuses)[keyof typeof QuotationStatuses];

export const QuotationItemTypes = {
  Service: "service",
  Product: "product",
  Labor: "labor",
  Custom: "custom",
} as const;

export type QuotationItemType =
  (typeof QuotationItemTypes)[keyof typeof QuotationItemTypes];

export const QuotationTerminalStatuses: readonly QuotationStatus[] = [
  QuotationStatuses.Accepted,
  QuotationStatuses.Rejected,
  QuotationStatuses.Expired,
  QuotationStatuses.Cancelled,
  QuotationStatuses.ConvertedToInvoice,
] as const;

/** Implemented — matches public.invoice_status */
export const InvoiceStatuses = {
  Draft: "draft",
  Issued: "issued",
  Viewed: "viewed",
  CustomerApproved: "customer_approved",
  PartiallyPaid: "partially_paid",
  Paid: "paid",
  Overdue: "overdue",
  Cancelled: "cancelled",
  PartiallyRefunded: "partially_refunded",
  Refunded: "refunded",
} as const;

export type InvoiceStatus = (typeof InvoiceStatuses)[keyof typeof InvoiceStatuses];

export const InvoiceItemTypes = {
  Service: "service",
  Product: "product",
  Labor: "labor",
  Custom: "custom",
} as const;

export type InvoiceItemType =
  (typeof InvoiceItemTypes)[keyof typeof InvoiceItemTypes];

export const InvoiceTerminalStatuses: readonly InvoiceStatus[] = [
  InvoiceStatuses.Paid,
  InvoiceStatuses.Cancelled,
  InvoiceStatuses.Refunded,
  InvoiceStatuses.PartiallyRefunded,
] as const;

/** Implemented — matches public.payment_status */
export const PaymentStatuses = {
  Created: "created",
  Pending: "pending",
  RequiresAction: "requires_action",
  Authorized: "authorized",
  Captured: "captured",
  Failed: "failed",
  Cancelled: "cancelled",
  Expired: "expired",
  PartiallyRefunded: "partially_refunded",
  Refunded: "refunded",
} as const;

export type PaymentStatus = (typeof PaymentStatuses)[keyof typeof PaymentStatuses];

/** Implemented — matches public.payment_method */
export const PaymentMethods = {
  Cash: "cash",
  Card: "card",
  Benefit: "benefit",
  BenefitPay: "benefitpay",
  ApplePay: "apple_pay",
  BankTransfer: "bank_transfer",
  Other: "other",
} as const;

export type PaymentMethod =
  (typeof PaymentMethods)[keyof typeof PaymentMethods];

/** Phase 8: only cash is enabled in the service layer. */
export const EnabledPaymentMethods: readonly PaymentMethod[] = [
  PaymentMethods.Cash,
] as const;

export const ReviewStatuses = {
  Pending: "pending",
  Published: "published",
  Hidden: "hidden",
  Flagged: "flagged",
  Removed: "removed",
} as const;

export type ReviewStatus = (typeof ReviewStatuses)[keyof typeof ReviewStatuses];

/** Implemented — matches public.review_verification_type */
export const ReviewVerificationTypes = {
  CompletedAppointmentPaidInvoice: "completed_appointment_paid_invoice",
  PaidInvoice: "paid_invoice",
  AdminVerified: "admin_verified",
} as const;

export type ReviewVerificationType =
  (typeof ReviewVerificationTypes)[keyof typeof ReviewVerificationTypes];

/** Implemented — matches public.review_rating_dimension */
export const ReviewRatingDimensions = {
  WorkQuality: "work_quality",
  PricingTransparency: "pricing_transparency",
  Timeliness: "timeliness",
  CustomerService: "customer_service",
  OverallExperience: "overall_experience",
} as const;

export type ReviewRatingDimension =
  (typeof ReviewRatingDimensions)[keyof typeof ReviewRatingDimensions];

/** Implemented — matches public.review_report_reason */
export const ReviewReportReasons = {
  Spam: "spam",
  Abusive: "abusive",
  PersonalInformation: "personal_information",
  Fraudulent: "fraudulent",
  Irrelevant: "irrelevant",
  ConflictOfInterest: "conflict_of_interest",
  Other: "other",
} as const;

export type ReviewReportReason =
  (typeof ReviewReportReasons)[keyof typeof ReviewReportReasons];

/** Implemented — matches public.review_report_status */
export const ReviewReportStatuses = {
  Open: "open",
  Reviewed: "reviewed",
  Dismissed: "dismissed",
  ActionTaken: "action_taken",
} as const;

export type ReviewReportStatus =
  (typeof ReviewReportStatuses)[keyof typeof ReviewReportStatuses];

/** Implemented — matches public.review_moderation_action */
export const ReviewModerationActions = {
  Flag: "flag",
  Hide: "hide",
  Restore: "restore",
  Remove: "remove",
  DismissReport: "dismiss_report",
} as const;

export type ReviewModerationAction =
  (typeof ReviewModerationActions)[keyof typeof ReviewModerationActions];

/** Implemented — matches public.dispute_status */
export const DisputeStatuses = {
  Opened: "opened",
  AwaitingBusiness: "awaiting_business",
  AwaitingCustomer: "awaiting_customer",
  UnderReview: "under_review",
  Resolved: "resolved",
  Rejected: "rejected",
  Closed: "closed",
  Withdrawn: "withdrawn",
} as const;

export type DisputeStatus = (typeof DisputeStatuses)[keyof typeof DisputeStatuses];

/** Implemented — matches public.dispute_actor_type */
export const DisputeActorTypes = {
  Customer: "customer",
  Business: "business",
  Admin: "admin",
  System: "system",
} as const;

export type DisputeActorType =
  (typeof DisputeActorTypes)[keyof typeof DisputeActorTypes];

/** Implemented — matches public.dispute_reason_code */
export const DisputeReasonCodes = {
  ServiceNotCompleted: "service_not_completed",
  ServiceQuality: "service_quality",
  UnexpectedCharge: "unexpected_charge",
  PricingDispute: "pricing_dispute",
  IncorrectInvoice: "incorrect_invoice",
  PaymentIssue: "payment_issue",
  BusinessNoShow: "business_no_show",
  CustomerNoShow: "customer_no_show",
  AppointmentIssue: "appointment_issue",
  QuotationIssue: "quotation_issue",
  ReviewIssue: "review_issue",
  DamageClaim: "damage_claim",
  CommunicationIssue: "communication_issue",
  Other: "other",
} as const;

export type DisputeReasonCode =
  (typeof DisputeReasonCodes)[keyof typeof DisputeReasonCodes];

/** Implemented — matches public.dispute_resolution_code */
export const DisputeResolutionCodes = {
  CustomerSupported: "customer_supported",
  BusinessSupported: "business_supported",
  MutualResolution: "mutual_resolution",
  InsufficientEvidence: "insufficient_evidence",
  PolicyViolationCustomer: "policy_violation_customer",
  PolicyViolationBusiness: "policy_violation_business",
  Duplicate: "duplicate",
  InvalidDispute: "invalid_dispute",
  Other: "other",
} as const;

export type DisputeResolutionCode =
  (typeof DisputeResolutionCodes)[keyof typeof DisputeResolutionCodes];

/** Implemented — matches public.dispute_resolution_action_type */
export const DisputeResolutionActionTypes = {
  Assigned: "assigned",
  RequestedCustomerResponse: "requested_customer_response",
  RequestedBusinessResponse: "requested_business_response",
  MarkedUnderReview: "marked_under_review",
  Resolved: "resolved",
  Rejected: "rejected",
  Closed: "closed",
  Reopened: "reopened",
  Withdrawn: "withdrawn",
  InternalNote: "internal_note",
} as const;

export type DisputeResolutionActionType =
  (typeof DisputeResolutionActionTypes)[keyof typeof DisputeResolutionActionTypes];

/** Implemented — matches public.service_pricing_type */
export const ServicePricingTypes = {
  Fixed: "fixed",
  StartingFrom: "starting_from",
  Range: "range",
  QuoteRequired: "quote_required",
  Free: "free",
} as const;

export type ServicePricingType =
  (typeof ServicePricingTypes)[keyof typeof ServicePricingTypes];

/** Implemented — matches public.product_stock_status */
export const ProductStockStatuses = {
  InStock: "in_stock",
  LowStock: "low_stock",
  OutOfStock: "out_of_stock",
  Preorder: "preorder",
  Unavailable: "unavailable",
} as const;

export type ProductStockStatus =
  (typeof ProductStockStatuses)[keyof typeof ProductStockStatuses];

/** Implemented — matches public.compatibility_type */
export const CompatibilityTypes = {
  AllVehicles: "all_vehicles",
  Make: "make",
  Model: "model",
  YearRange: "year_range",
} as const;

export type CompatibilityType =
  (typeof CompatibilityTypes)[keyof typeof CompatibilityTypes];

/** Implemented — matches public.inventory_adjustment_type */
export const InventoryAdjustmentTypes = {
  ManualAdd: "manual_add",
  ManualRemove: "manual_remove",
  Correction: "correction",
  Reservation: "reservation",
  ReservationRelease: "reservation_release",
  Sale: "sale",
  Refund: "refund",
} as const;

export type InventoryAdjustmentType =
  (typeof InventoryAdjustmentTypes)[keyof typeof InventoryAdjustmentTypes];

function assertUnique(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`Duplicate ${label} status values detected.`);
  }
}

export function assertUniqueStatusRegistries(): void {
  assertUnique("UserStatuses", Object.values(UserStatuses));
  assertUnique("BusinessStatuses", Object.values(BusinessStatuses));
  assertUnique("BusinessVerificationStatuses", Object.values(BusinessVerificationStatuses));
  assertUnique("BusinessApplicationStatuses", Object.values(BusinessApplicationStatuses));
  assertUnique("MembershipStatuses", Object.values(MembershipStatuses));
  assertUnique("AppointmentStatuses", Object.values(AppointmentStatuses));
  assertUnique("QuotationStatuses", Object.values(QuotationStatuses));
  assertUnique("InvoiceStatuses", Object.values(InvoiceStatuses));
  assertUnique("PaymentStatuses", Object.values(PaymentStatuses));
  assertUnique("ReviewStatuses", Object.values(ReviewStatuses));
  assertUnique("ReviewVerificationTypes", Object.values(ReviewVerificationTypes));
  assertUnique("ReviewRatingDimensions", Object.values(ReviewRatingDimensions));
  assertUnique("ReviewReportReasons", Object.values(ReviewReportReasons));
  assertUnique("ReviewReportStatuses", Object.values(ReviewReportStatuses));
  assertUnique("ReviewModerationActions", Object.values(ReviewModerationActions));
  assertUnique("DisputeStatuses", Object.values(DisputeStatuses));
  assertUnique("DisputeActorTypes", Object.values(DisputeActorTypes));
  assertUnique("DisputeReasonCodes", Object.values(DisputeReasonCodes));
  assertUnique("DisputeResolutionCodes", Object.values(DisputeResolutionCodes));
  assertUnique(
    "DisputeResolutionActionTypes",
    Object.values(DisputeResolutionActionTypes),
  );
  assertUnique("ServicePricingTypes", Object.values(ServicePricingTypes));
  assertUnique("ProductStockStatuses", Object.values(ProductStockStatuses));
  assertUnique("CompatibilityTypes", Object.values(CompatibilityTypes));
  assertUnique("InventoryAdjustmentTypes", Object.values(InventoryAdjustmentTypes));
}
