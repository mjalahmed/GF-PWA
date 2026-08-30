import type { ErrorCode } from "../constants/error-codes.ts";
import { ErrorCodes } from "../constants/error-codes.ts";

export type AppErrorOptions = {
  code: ErrorCode | string;
  message: string;
  status: number;
  details?: unknown;
  cause?: unknown;
  expose?: boolean;
};

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;
  readonly expose: boolean;
  override readonly cause?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details ?? null;
    this.expose = options.expose ?? true;
    this.cause = options.cause;
  }
}

export class AuthenticationError extends AppError {
  constructor(code: string, message: string, details: unknown = null) {
    super({ code, message, status: 401, details });
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message = "You do not have permission to perform this action.",
    details: unknown = null,
  ) {
    super({
      code: ErrorCodes.Authorization.PermissionDenied,
      message,
      status: 403,
      details,
    });
    this.name = "AuthorizationError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "The request contains invalid data.",
    details: unknown = null,
  ) {
    super({
      code: ErrorCodes.Validation.InvalidRequest,
      message,
      status: 422,
      details,
    });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = "The requested resource was not found.",
    details: unknown = null,
  ) {
    super({
      code: ErrorCodes.Resource.NotFound,
      message,
      status: 404,
      details,
    });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(
    code: string = ErrorCodes.Resource.Conflict,
    message = "The request conflicts with the current state.",
    details: unknown = null,
  ) {
    super({ code, message, status: 409, details });
    this.name = "ConflictError";
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(
    message = "This status change is not allowed.",
    details: unknown = null,
  ) {
    super({
      code: ErrorCodes.Resource.InvalidStateTransition,
      message,
      status: 409,
      details,
    });
    this.name = "InvalidStateTransitionError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please try again later.") {
    super({
      code: ErrorCodes.RateLimit.Limited,
      message,
      status: 429,
    });
    this.name = "RateLimitError";
  }
}

export class InternalError extends AppError {
  constructor(
    message = "Something went wrong. Please try again.",
    cause?: unknown,
  ) {
    super({
      code: ErrorCodes.Internal.Unexpected,
      message,
      status: 500,
      cause,
      expose: true,
    });
    this.name = "InternalError";
  }
}
