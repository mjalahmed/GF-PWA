import { AppError, AuthorizationError } from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";

export class DisputeNotFoundError extends AppError {
  constructor(id?: string) {
    super({
      code: ErrorCodes.Dispute.NotFound,
      message: "Dispute was not found.",
      status: 404,
      details: id ? { disputeId: id } : null,
    });
    this.name = "DisputeNotFoundError";
  }
}

export class DisputeAccessDeniedError extends AuthorizationError {
  constructor(message = "You do not have access to this dispute.") {
    super(message);
    this.name = "DisputeAccessDeniedError";
  }
}

export class DisputeAlreadyExistsError extends AppError {
  constructor(disputeId?: string) {
    super({
      code: ErrorCodes.Dispute.AlreadyExists,
      message: "An active dispute already exists for this source.",
      status: 409,
      details: disputeId ? { disputeId } : null,
    });
    this.name = "DisputeAlreadyExistsError";
  }
}

export class DisputeWindowExpiredError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Dispute.WindowExpired,
      message: "The dispute filing window has expired.",
      status: 409,
    });
    this.name = "DisputeWindowExpiredError";
  }
}

export class DisputeInvalidSourceError extends AppError {
  constructor(message: string, details: unknown = null) {
    super({
      code: ErrorCodes.Dispute.InvalidSource,
      message,
      status: 422,
      details,
    });
    this.name = "DisputeInvalidSourceError";
  }
}

export class DisputeInvalidTransitionError extends AppError {
  constructor(message: string, details: unknown = null) {
    super({
      code: ErrorCodes.Dispute.InvalidTransition,
      message,
      status: 409,
      details,
    });
    this.name = "DisputeInvalidTransitionError";
  }
}

export class DisputeNotMessageableError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Dispute.NotMessageable,
      message: "This dispute no longer accepts messages.",
      status: 409,
    });
    this.name = "DisputeNotMessageableError";
  }
}

export class DisputeReasonRequiredError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Dispute.ReasonRequired,
      message: "A reason is required for this dispute action.",
      status: 422,
    });
    this.name = "DisputeReasonRequiredError";
  }
}

export class DisputeResolutionRequiredError extends AppError {
  constructor() {
    super({
      code: ErrorCodes.Dispute.ResolutionRequired,
      message: "Resolution code and summary are required.",
      status: 422,
    });
    this.name = "DisputeResolutionRequiredError";
  }
}

export class DisputeEvidenceNotFoundError extends AppError {
  constructor(id?: string) {
    super({
      code: ErrorCodes.Dispute.EvidenceNotFound,
      message: "Dispute evidence was not found.",
      status: 404,
      details: id ? { evidenceId: id } : null,
    });
    this.name = "DisputeEvidenceNotFoundError";
  }
}

export class DisputeEvidenceInvalidError extends AppError {
  constructor(message: string) {
    super({
      code: ErrorCodes.Dispute.EvidenceInvalid,
      message,
      status: 422,
    });
    this.name = "DisputeEvidenceInvalidError";
  }
}

export class DisputeWithdrawNotAllowedError extends AppError {
  constructor(message = "This dispute cannot be withdrawn.") {
    super({
      code: ErrorCodes.Dispute.WithdrawNotAllowed,
      message,
      status: 409,
    });
    this.name = "DisputeWithdrawNotAllowedError";
  }
}
