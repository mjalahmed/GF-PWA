import {
  DisputeReasonCodes,
  DisputeStatuses,
  type DisputeReasonCode,
  type DisputeStatus,
} from "../../core/constants/statuses.ts";
import {
  DisputeInvalidSourceError,
  DisputeInvalidTransitionError,
  DisputeWindowExpiredError,
  DisputeWithdrawNotAllowedError,
} from "./dispute.errors.ts";
import type {
  DisputeSourceRefs,
  DisputeWindowEventTimestamps,
} from "./dispute.types.ts";
import { DISPUTE_MESSAGE_BLOCKED_STATUSES } from "./dispute.types.ts";

export const DISPUTE_WINDOW_DAYS = 90;
export const DISPUTE_WINDOW_MS = DISPUTE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export const DISPUTE_REASON_CODE_VALUES = Object.values(
  DisputeReasonCodes,
) as DisputeReasonCode[];

/** Action-driven status transitions only */
export const DISPUTE_STATUS_TRANSITIONS: Partial<
  Record<DisputeStatus, readonly DisputeStatus[]>
> = {
  [DisputeStatuses.Opened]: [
    DisputeStatuses.AwaitingBusiness,
    DisputeStatuses.UnderReview,
    DisputeStatuses.Rejected,
    DisputeStatuses.Withdrawn,
  ],
  [DisputeStatuses.AwaitingBusiness]: [
    DisputeStatuses.AwaitingCustomer,
    DisputeStatuses.UnderReview,
  ],
  [DisputeStatuses.AwaitingCustomer]: [
    DisputeStatuses.AwaitingBusiness,
    DisputeStatuses.UnderReview,
  ],
  [DisputeStatuses.UnderReview]: [
    DisputeStatuses.AwaitingCustomer,
    DisputeStatuses.AwaitingBusiness,
    DisputeStatuses.Resolved,
    DisputeStatuses.Rejected,
  ],
  [DisputeStatuses.Resolved]: [DisputeStatuses.Closed],
  [DisputeStatuses.Rejected]: [DisputeStatuses.Closed],
};

export const DISPUTE_WITHDRAWABLE_STATUSES: readonly DisputeStatus[] = [
  DisputeStatuses.Opened,
  DisputeStatuses.AwaitingBusiness,
  DisputeStatuses.AwaitingCustomer,
];

export function assertDisputeTransition(
  from: DisputeStatus,
  to: DisputeStatus,
): void {
  const allowed = DISPUTE_STATUS_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new DisputeInvalidTransitionError(
      `Cannot transition dispute from '${from}' to '${to}'.`,
      { from, to },
    );
  }
}

export function canSendDisputeMessage(status: DisputeStatus): boolean {
  return !DISPUTE_MESSAGE_BLOCKED_STATUSES.includes(status);
}

export function assertWithdrawAllowed(input: {
  status: DisputeStatus;
  customerId: string;
  actorUserId: string;
  openedByType: string;
}): void {
  if (input.openedByType !== "customer" || input.customerId !== input.actorUserId) {
    throw new DisputeWithdrawNotAllowedError(
      "Only the original customer can withdraw this dispute.",
    );
  }
  if (!DISPUTE_WITHDRAWABLE_STATUSES.includes(input.status)) {
    throw new DisputeWithdrawNotAllowedError();
  }
}

export function validateReasonCode(code: string): asserts code is DisputeReasonCode {
  if (!DISPUTE_REASON_CODE_VALUES.includes(code as DisputeReasonCode)) {
    throw new DisputeInvalidSourceError(`Invalid dispute reason code '${code}'.`);
  }
}

export function assertAtLeastOneDisputeSource(sources: DisputeSourceRefs): void {
  if (
    !sources.appointmentId &&
    !sources.quotationId &&
    !sources.invoiceId &&
    !sources.paymentId &&
    !sources.reviewId
  ) {
    throw new DisputeInvalidSourceError(
      "At least one linked source (appointment, quotation, invoice, payment, or review) is required.",
    );
  }
}

export type DisputeSourceEntity = {
  customerId: string;
  businessId: string;
  invoiceId?: string | null;
};

export function assertDisputeSourceGraph(input: {
  customerId: string;
  businessId: string;
  sources: DisputeSourceRefs;
  appointment?: DisputeSourceEntity | null;
  quotation?: DisputeSourceEntity | null;
  invoice?: DisputeSourceEntity | null;
  payment?: (DisputeSourceEntity & { invoiceId: string }) | null;
  review?: DisputeSourceEntity | null;
}): void {
  assertAtLeastOneDisputeSource(input.sources);

  const assertMatch = (
    label: string,
    entity: DisputeSourceEntity | null | undefined,
    id: string | null | undefined,
  ) => {
    if (!id) return;
    if (!entity) {
      throw new DisputeInvalidSourceError(`${label} was not found.`, { id });
    }
    if (
      entity.customerId !== input.customerId ||
      entity.businessId !== input.businessId
    ) {
      throw new DisputeInvalidSourceError(
        `${label} does not match the dispute customer and business.`,
        { id },
      );
    }
  };

  assertMatch("Appointment", input.appointment, input.sources.appointmentId);
  assertMatch("Quotation", input.quotation, input.sources.quotationId);
  assertMatch("Invoice", input.invoice, input.sources.invoiceId);
  assertMatch("Review", input.review, input.sources.reviewId);
  assertMatch("Payment", input.payment, input.sources.paymentId);

  if (input.sources.paymentId && input.sources.invoiceId && input.payment) {
    if (input.payment.invoiceId !== input.sources.invoiceId) {
      throw new DisputeInvalidSourceError(
        "Payment must belong to the linked invoice.",
        {
          paymentId: input.sources.paymentId,
          invoiceId: input.sources.invoiceId,
        },
      );
    }
  }
}

export function latestDisputeWindowEvent(
  events: DisputeWindowEventTimestamps,
): string | null {
  const candidates = [
    events.invoicePaidAt,
    events.appointmentCompletedAt,
    events.reviewCreatedAt,
    events.quotationAcceptedAt,
    events.paymentConfirmedAt,
    events.fallbackCreatedAt,
  ].filter((value): value is string => Boolean(value));

  if (candidates.length === 0) return null;

  return candidates.reduce((latest, current) =>
    new Date(current).getTime() > new Date(latest).getTime() ? current : latest
  );
}

export function isDisputeWindowExpired(
  events: DisputeWindowEventTimestamps,
  nowMs = Date.now(),
): boolean {
  const anchor = latestDisputeWindowEvent(events);
  if (!anchor) return false;
  return nowMs - new Date(anchor).getTime() > DISPUTE_WINDOW_MS;
}

export function assertDisputeWindowOpen(events: DisputeWindowEventTimestamps): void {
  if (isDisputeWindowExpired(events)) {
    throw new DisputeWindowExpiredError();
  }
}
