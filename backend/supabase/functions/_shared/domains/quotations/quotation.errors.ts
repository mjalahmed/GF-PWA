import { AppError, AuthorizationError } from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";

export class QuotationNotFoundError extends AppError {
  constructor(id?: string) {
    super({
      code: ErrorCodes.Quotation.NotFound,
      message: "Quotation was not found.",
      status: 404,
      details: id ? { quotationId: id } : null,
    });
    this.name = "QuotationNotFoundError";
  }
}

export class QuotationAccessDeniedError extends AuthorizationError {
  constructor(message = "You do not have access to this quotation.") {
    super(message);
    this.name = "QuotationAccessDeniedError";
  }
}

export class QuotationNotEditableError extends AppError {
  constructor(message = "Only draft quotations can be edited.") {
    super({
      code: ErrorCodes.Quotation.NotEditable,
      message,
      status: 409,
    });
    this.name = "QuotationNotEditableError";
  }
}

export class QuotationAlreadyAcceptedError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Quotation.AlreadyAccepted,
      message: "Accepted quotations cannot be changed.",
      status: 409,
    });
    this.name = "QuotationAlreadyAcceptedError";
  }
}

export class QuotationExpiredError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Quotation.Expired,
      message: "This quotation has expired.",
      status: 409,
    });
    this.name = "QuotationExpiredError";
  }
}

export class QuotationInvalidTransitionError extends AppError {
  constructor(message: string, details: unknown = null) {
    super({
      code: ErrorCodes.Quotation.InvalidTransition,
      message,
      status: 409,
      details,
    });
    this.name = "QuotationInvalidTransitionError";
  }
}

export class QuotationItemInvalidError extends AppError {
  constructor(message: string, details: unknown = null) {
    super({
      code: ErrorCodes.Quotation.ItemInvalid,
      message,
      status: 422,
      details,
    });
    this.name = "QuotationItemInvalidError";
  }
}

export class QuotationTotalInvalidError extends AppError {
  constructor(message: string, details: unknown = null) {
    super({
      code: ErrorCodes.Quotation.TotalInvalid,
      message,
      status: 422,
      details,
    });
    this.name = "QuotationTotalInvalidError";
  }
}

export class QuotationRevisionConflictError extends AppError {
  constructor(message = "This quotation cannot be revised in its current state.") {
    super({
      code: ErrorCodes.Quotation.RevisionConflict,
      message,
      status: 409,
    });
    this.name = "QuotationRevisionConflictError";
  }
}

export class QuotationsDisabledError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Validation.InvalidRequest,
      message: "Quotations are disabled for this business.",
      status: 422,
    });
    this.name = "QuotationsDisabledError";
  }
}
