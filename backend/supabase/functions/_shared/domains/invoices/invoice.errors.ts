import { AppError, AuthorizationError } from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import { QuotationTotalInvalidError } from "../quotations/quotation.errors.ts";

export class InvoiceNotFoundError extends AppError {
  constructor(id?: string) {
    super({
      code: ErrorCodes.Invoice.NotFound,
      message: "Invoice was not found.",
      status: 404,
      details: id ? { invoiceId: id } : null,
    });
    this.name = "InvoiceNotFoundError";
  }
}

export class InvoiceAccessDeniedError extends AuthorizationError {
  constructor(message = "You do not have access to this invoice.") {
    super(message);
    this.name = "InvoiceAccessDeniedError";
  }
}

export class InvoiceNotEditableError extends AppError {
  constructor(message = "Only draft invoices can be edited.") {
    super({
      code: ErrorCodes.Invoice.NotEditable,
      message,
      status: 409,
    });
    this.name = "InvoiceNotEditableError";
  }
}

export class InvoiceAlreadyPaidError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Invoice.AlreadyPaid,
      message: "This invoice is already fully paid.",
      status: 409,
    });
    this.name = "InvoiceAlreadyPaidError";
  }
}

export class InvoiceNotPayableError extends AppError {
  constructor(message = "This invoice cannot accept payments in its current state.") {
    super({
      code: ErrorCodes.Invoice.NotPayable,
      message,
      status: 409,
    });
    this.name = "InvoiceNotPayableError";
  }
}

export class InvoiceApprovalRequiredError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Invoice.ApprovalRequired,
      message: "Customer approval is required before recording payment.",
      status: 409,
    });
    this.name = "InvoiceApprovalRequiredError";
  }
}

export class InvoiceInvalidTransitionError extends AppError {
  constructor(message: string, details: unknown = null) {
    super({
      code: ErrorCodes.Invoice.InvalidTransition,
      message,
      status: 409,
      details,
    });
    this.name = "InvoiceInvalidTransitionError";
  }
}

export class InvoiceItemInvalidError extends AppError {
  constructor(message: string, details: unknown = null) {
    super({
      code: ErrorCodes.Invoice.ItemInvalid,
      message,
      status: 422,
      details,
    });
    this.name = "InvoiceItemInvalidError";
  }
}

export class InvoiceTotalInvalidError extends AppError {
  constructor(message: string, details: unknown = null) {
    super({
      code: ErrorCodes.Invoice.TotalInvalid,
      message,
      status: 422,
      details,
    });
    this.name = "InvoiceTotalInvalidError";
  }
}

export class InvoiceAlreadyCreatedFromQuotationError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Invoice.AlreadyCreatedFromQuotation,
      message: "An invoice was already created from this quotation.",
      status: 409,
    });
    this.name = "InvoiceAlreadyCreatedFromQuotationError";
  }
}

export class InvoicesDisabledError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Validation.InvalidRequest,
      message: "Invoices are disabled for this business.",
      status: 422,
    });
    this.name = "InvoicesDisabledError";
  }
}

export class CashPaymentsDisabledError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Validation.InvalidRequest,
      message: "Cash payments are disabled for this business.",
      status: 422,
    });
    this.name = "CashPaymentsDisabledError";
  }
}

export class PaymentNotFoundError extends AppError {
  constructor(id?: string) {
    super({
      code: ErrorCodes.Payment.NotFound,
      message: "Payment was not found.",
      status: 404,
      details: id ? { paymentId: id } : null,
    });
    this.name = "PaymentNotFoundError";
  }
}

export class PaymentAccessDeniedError extends AuthorizationError {
  constructor(message = "You do not have access to this payment.") {
    super(message);
    this.name = "PaymentAccessDeniedError";
  }
}

export class PaymentAmountInvalidError extends AppError {
  constructor(message = "Payment amount is invalid.") {
    super({
      code: ErrorCodes.Payment.AmountInvalid,
      message,
      status: 422,
    });
    this.name = "PaymentAmountInvalidError";
  }
}

export class PaymentOverpaymentError extends AppError {
  constructor(message = "Payment amount exceeds the remaining balance.") {
    super({
      code: ErrorCodes.Payment.Overpayment,
      message,
      status: 422,
    });
    this.name = "PaymentOverpaymentError";
  }
}

export class PaymentMethodNotEnabledError extends AppError {
  constructor(message = "This payment method is not enabled.") {
    super({
      code: ErrorCodes.Payment.MethodNotEnabled,
      message,
      status: 422,
    });
    this.name = "PaymentMethodNotEnabledError";
  }
}

export function wrapMoneyError(err: unknown): never {
  if (err instanceof QuotationTotalInvalidError) {
    throw new InvoiceTotalInvalidError(err.message, err.details);
  }
  throw err;
}

export function mapInvoiceRpcError(message: string): never {
  if (message.includes("INVOICE_NOT_FOUND")) {
    throw new InvoiceNotFoundError();
  }
  if (message.includes("INVOICE_NOT_PAYABLE")) {
    throw new InvoiceNotPayableError();
  }
  if (message.includes("INVOICE_ALREADY_PAID")) {
    throw new InvoiceAlreadyPaidError();
  }
  if (message.includes("INVOICE_APPROVAL_REQUIRED")) {
    throw new InvoiceApprovalRequiredError();
  }
  if (message.includes("INVOICE_ALREADY_CREATED_FROM_QUOTATION")) {
    throw new InvoiceAlreadyCreatedFromQuotationError();
  }
  if (message.includes("PAYMENT_AMOUNT_INVALID")) {
    throw new PaymentAmountInvalidError();
  }
  if (message.includes("PAYMENT_OVERPAYMENT")) {
    throw new PaymentOverpaymentError();
  }
  if (message.includes("PAYMENT_ALREADY_PROCESSED")) {
    throw new AppError({
      code: ErrorCodes.Payment.AlreadyProcessed,
      message: "This payment was already processed.",
      status: 409,
    });
  }
  if (message.includes("QUOTATION_NOT_FOUND")) {
    throw new AppError({
      code: ErrorCodes.Quotation.NotFound,
      message: "Quotation was not found.",
      status: 404,
    });
  }
  if (message.includes("QUOTATION_NOT_EDITABLE")) {
    throw new AppError({
      code: ErrorCodes.Quotation.NotEditable,
      message: "Only accepted quotations can be converted to invoices.",
      status: 409,
    });
  }
  throw new AppError({
    code: ErrorCodes.Internal.Unexpected,
    message: message || "Financial operation failed.",
    status: 500,
  });
}
