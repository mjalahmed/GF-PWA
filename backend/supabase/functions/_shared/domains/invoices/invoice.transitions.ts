import {
  EnabledPaymentMethods,
  InvoiceStatuses,
  PaymentMethods,
  type InvoiceStatus,
} from "../../core/constants/statuses.ts";
import {
  formatMoney,
  parseMoney,
} from "../quotations/quotation.money.ts";
import {
  InvoiceApprovalRequiredError,
  InvoiceInvalidTransitionError,
  InvoiceNotPayableError,
  PaymentAmountInvalidError,
  PaymentMethodNotEnabledError,
  PaymentOverpaymentError,
  wrapMoneyError,
} from "./invoice.errors.ts";

/** Allowed lifecycle transitions: from -> set of to */
export const INVOICE_TRANSITIONS: Record<
  InvoiceStatus,
  readonly InvoiceStatus[]
> = {
  [InvoiceStatuses.Draft]: [
    InvoiceStatuses.Issued,
    InvoiceStatuses.Cancelled,
  ],
  [InvoiceStatuses.Issued]: [
    InvoiceStatuses.Viewed,
    InvoiceStatuses.CustomerApproved,
    InvoiceStatuses.Cancelled,
    InvoiceStatuses.PartiallyPaid,
    InvoiceStatuses.Paid,
  ],
  [InvoiceStatuses.Viewed]: [
    InvoiceStatuses.CustomerApproved,
    InvoiceStatuses.Cancelled,
    InvoiceStatuses.PartiallyPaid,
    InvoiceStatuses.Paid,
  ],
  [InvoiceStatuses.CustomerApproved]: [
    InvoiceStatuses.PartiallyPaid,
    InvoiceStatuses.Paid,
  ],
  [InvoiceStatuses.PartiallyPaid]: [InvoiceStatuses.Paid],
  [InvoiceStatuses.Paid]: [],
  [InvoiceStatuses.Overdue]: [
    InvoiceStatuses.PartiallyPaid,
    InvoiceStatuses.Paid,
  ],
  [InvoiceStatuses.Cancelled]: [],
  [InvoiceStatuses.PartiallyRefunded]: [InvoiceStatuses.Refunded],
  [InvoiceStatuses.Refunded]: [],
};

/** Future refund transitions — no actions in Phase 8. */
export const INVOICE_REFUND_TRANSITIONS: Partial<
  Record<InvoiceStatus, readonly InvoiceStatus[]>
> = {
  [InvoiceStatuses.Paid]: [
    InvoiceStatuses.PartiallyRefunded,
    InvoiceStatuses.Refunded,
  ],
  [InvoiceStatuses.PartiallyRefunded]: [InvoiceStatuses.Refunded],
};

const PAYMENT_TARGET_STATUSES: readonly InvoiceStatus[] = [
  InvoiceStatuses.PartiallyPaid,
  InvoiceStatuses.Paid,
];

export function assertTransition(
  from: InvoiceStatus,
  to: InvoiceStatus,
  options?: { requiresCustomerApproval?: boolean },
): void {
  const allowed = INVOICE_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new InvoiceInvalidTransitionError(
      `Cannot transition invoice from '${from}' to '${to}'.`,
      { from, to },
    );
  }

  if (PAYMENT_TARGET_STATUSES.includes(to)) {
    const requiresApproval = options?.requiresCustomerApproval ?? false;
    if (
      requiresApproval &&
      from !== InvoiceStatuses.CustomerApproved &&
      from !== InvoiceStatuses.PartiallyPaid
    ) {
      throw new InvoiceApprovalRequiredError();
    }
    if (
      !requiresApproval &&
      from !== InvoiceStatuses.Issued &&
      from !== InvoiceStatuses.Viewed &&
      from !== InvoiceStatuses.CustomerApproved &&
      from !== InvoiceStatuses.PartiallyPaid &&
      from !== InvoiceStatuses.Overdue
    ) {
      throw new InvoiceNotPayableError();
    }
  }
}

export function isTerminalStatus(status: InvoiceStatus): boolean {
  return (INVOICE_TRANSITIONS[status] ?? []).length === 0;
}

export const CANCELLABLE_STATUSES: readonly InvoiceStatus[] = [
  InvoiceStatuses.Draft,
  InvoiceStatuses.Issued,
  InvoiceStatuses.Viewed,
];

export function assertInvoicePayable(
  status: InvoiceStatus,
  requiresCustomerApproval: boolean,
): void {
  if (
    status === InvoiceStatuses.Draft ||
    status === InvoiceStatuses.Cancelled ||
    status === InvoiceStatuses.Paid ||
    status === InvoiceStatuses.Refunded ||
    status === InvoiceStatuses.PartiallyRefunded
  ) {
    throw new InvoiceNotPayableError();
  }

  if (requiresCustomerApproval) {
    if (
      status !== InvoiceStatuses.CustomerApproved &&
      status !== InvoiceStatuses.PartiallyPaid
    ) {
      throw new InvoiceApprovalRequiredError();
    }
    return;
  }

  const payableWithoutApproval: InvoiceStatus[] = [
    InvoiceStatuses.Issued,
    InvoiceStatuses.Viewed,
    InvoiceStatuses.CustomerApproved,
    InvoiceStatuses.PartiallyPaid,
    InvoiceStatuses.Overdue,
  ];
  if (!payableWithoutApproval.includes(status)) {
    throw new InvoiceNotPayableError();
  }
}

export function assertPaymentMethodEnabled(method: string): void {
  if (!EnabledPaymentMethods.includes(method as typeof EnabledPaymentMethods[number])) {
    throw new PaymentMethodNotEnabledError();
  }
}

/** Validates cash amount against remaining balance; returns normalized BHD amount. */
export function validateCashPaymentAmount(
  amount: string | number,
  remainingTotal: number,
): number {
  try {
    const amountFils = parseMoney(amount);
    const remainingFils = parseMoney(remainingTotal);

    if (amountFils <= 0) {
      throw new PaymentAmountInvalidError("Payment amount must be greater than zero.");
    }
    if (amountFils > remainingFils) {
      throw new PaymentOverpaymentError();
    }

    assertPaymentMethodEnabled(PaymentMethods.Cash);
    return formatMoney(amountFils);
  } catch (err) {
    wrapMoneyError(err);
  }
}
