import {
  AuthorizationError,
  ConflictError,
  InvalidStateTransitionError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import {
  BusinessApplicationStatuses,
  type BusinessApplicationStatus,
} from "../../core/constants/statuses.ts";

const ALLOWED_TRANSITIONS: Record<
  BusinessApplicationStatus,
  readonly BusinessApplicationStatus[]
> = {
  [BusinessApplicationStatuses.Draft]: [
    BusinessApplicationStatuses.Submitted,
    BusinessApplicationStatuses.Withdrawn,
  ],
  [BusinessApplicationStatuses.Submitted]: [
    BusinessApplicationStatuses.UnderReview,
    BusinessApplicationStatuses.Withdrawn,
  ],
  [BusinessApplicationStatuses.UnderReview]: [
    BusinessApplicationStatuses.ChangesRequested,
    BusinessApplicationStatuses.Approved,
    BusinessApplicationStatuses.Rejected,
  ],
  [BusinessApplicationStatuses.ChangesRequested]: [
    BusinessApplicationStatuses.Submitted,
    BusinessApplicationStatuses.Withdrawn,
  ],
  [BusinessApplicationStatuses.Rejected]: [
    BusinessApplicationStatuses.UnderReview,
  ],
  [BusinessApplicationStatuses.Approved]: [],
  [BusinessApplicationStatuses.Withdrawn]: [],
};

export function canTransitionApplicationStatus(
  from: string,
  to: string,
): boolean {
  const allowed = ALLOWED_TRANSITIONS[from as BusinessApplicationStatus];
  if (!allowed) return false;
  return allowed.includes(to as BusinessApplicationStatus);
}

export function assertApplicationStatusTransition(
  from: string,
  to: string,
): void {
  if (!canTransitionApplicationStatus(from, to)) {
    throw new InvalidStateTransitionError(
      `Cannot transition application from '${from}' to '${to}'.`,
      { from, to },
    );
  }
}

export function assertApplicationEditable(status: string): void {
  if (
    status !== BusinessApplicationStatuses.Draft &&
    status !== BusinessApplicationStatuses.ChangesRequested
  ) {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "Application can only be edited while in draft or changes_requested status.",
      { status },
    );
  }
}

export class ApplicationNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super(
      "Business application was not found.",
      id ? { applicationId: id } : null,
    );
    this.name = "ApplicationNotFoundError";
  }
}

export class DocumentNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super(
      "Application document was not found.",
      id ? { documentId: id } : null,
    );
    this.name = "DocumentNotFoundError";
  }
}

export class ApplicationAccessDeniedError extends AuthorizationError {
  constructor(message = "You do not have access to this application.") {
    super(message);
    this.name = "ApplicationAccessDeniedError";
  }
}

export class RequirementNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super(
      "Document requirement was not found.",
      id ? { documentRequirementId: id } : null,
    );
    this.name = "RequirementNotFoundError";
  }
}

export class CategoryNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super(
      "Business category was not found.",
      id ? { categoryId: id } : null,
    );
    this.name = "CategoryNotFoundError";
  }
}

export { ALLOWED_TRANSITIONS as businessApplicationAllowedTransitions };
