import {
  QuotationStatuses,
  type QuotationStatus,
} from "../../core/constants/statuses.ts";
import { QuotationInvalidTransitionError } from "./quotation.errors.ts";

/** Allowed transitions: from -> set of to */
export const QUOTATION_TRANSITIONS: Record<
  QuotationStatus,
  readonly QuotationStatus[]
> = {
  [QuotationStatuses.Draft]: [
    QuotationStatuses.Issued,
    QuotationStatuses.Cancelled,
  ],
  [QuotationStatuses.Issued]: [
    QuotationStatuses.Viewed,
    QuotationStatuses.Accepted,
    QuotationStatuses.Rejected,
    QuotationStatuses.Expired,
    QuotationStatuses.Cancelled,
  ],
  [QuotationStatuses.Viewed]: [
    QuotationStatuses.Accepted,
    QuotationStatuses.Rejected,
    QuotationStatuses.Expired,
    QuotationStatuses.Cancelled,
  ],
  [QuotationStatuses.Accepted]: [QuotationStatuses.ConvertedToInvoice],
  [QuotationStatuses.Rejected]: [],
  [QuotationStatuses.Expired]: [],
  [QuotationStatuses.Cancelled]: [],
  [QuotationStatuses.ConvertedToInvoice]: [],
};

export function assertTransition(
  from: QuotationStatus,
  to: QuotationStatus,
): void {
  const allowed = QUOTATION_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new QuotationInvalidTransitionError(
      `Cannot transition quotation from '${from}' to '${to}'.`,
      { from, to },
    );
  }
}

export function isTerminalStatus(status: QuotationStatus): boolean {
  return (QUOTATION_TRANSITIONS[status] ?? []).length === 0;
}

/** Statuses from which a new draft revision may be created. */
export const REVISABLE_STATUSES: readonly QuotationStatus[] = [
  QuotationStatuses.Issued,
  QuotationStatuses.Viewed,
  QuotationStatuses.Rejected,
];

export function isExpired(
  status: QuotationStatus,
  validUntil: string | null,
  now: Date = new Date(),
): boolean {
  if (
    status !== QuotationStatuses.Issued &&
    status !== QuotationStatuses.Viewed
  ) {
    return status === QuotationStatuses.Expired;
  }
  if (!validUntil) return false;
  return new Date(validUntil).getTime() <= now.getTime();
}
