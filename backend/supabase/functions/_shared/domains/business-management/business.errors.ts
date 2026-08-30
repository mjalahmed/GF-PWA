import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";

export class BusinessNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Business was not found.", id ? { businessId: id } : null);
    this.name = "BusinessNotFoundError";
  }
}

export class BusinessAccessDeniedError extends NotFoundError {
  constructor(message = "Business was not found.") {
    super(message);
    this.name = "BusinessAccessDeniedError";
  }
}

export class BusinessInactiveError extends ConflictError {
  constructor(status?: string) {
    super(
      ErrorCodes.Resource.Conflict,
      "Business is not active for this operation.",
      status ? { status } : null,
    );
    this.name = "BusinessInactiveError";
  }
}

export class BranchNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Branch was not found.", id ? { branchId: id } : null);
    this.name = "BranchNotFoundError";
  }
}

export class MembershipNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Membership was not found.", id ? { membershipId: id } : null);
    this.name = "MembershipNotFoundError";
  }
}

export class InvitationNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Invitation was not found.", id ? { invitationId: id } : null);
    this.name = "InvitationNotFoundError";
  }
}

export class ClosureNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Closure date was not found.", id ? { closureId: id } : null);
    this.name = "ClosureNotFoundError";
  }
}

export class FinalOwnerProtectedError extends ConflictError {
  constructor(message = "The final active owner cannot be modified.") {
    super(ErrorCodes.Resource.Conflict, message);
    this.name = "FinalOwnerProtectedError";
  }
}

export class ManagerCannotModifyOwnerError extends AuthorizationError {
  constructor(message = "Managers cannot modify owner memberships.") {
    super(message);
    this.name = "ManagerCannotModifyOwnerError";
  }
}

export class OnlyOwnerCanAssignOwnerError extends AuthorizationError {
  constructor(message = "Only owners can assign the owner role.") {
    super(message);
    this.name = "OnlyOwnerCanAssignOwnerError";
  }
}

export class BranchOperationError extends ConflictError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, details ?? null);
    this.name = "BranchOperationError";
  }
}

export class InvitationOperationError extends ConflictError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.Resource.Conflict, message, details ?? null);
    this.name = "InvitationOperationError";
  }
}

export class MembershipOperationError extends ConflictError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.Resource.Conflict, message, details ?? null);
    this.name = "MembershipOperationError";
  }
}

export function mapRpcError(message: string): never {
  if (message.includes("BRANCH_NOT_FOUND")) {
    throw new BranchNotFoundError();
  }
  if (message.includes("MEMBERSHIP_NOT_FOUND")) {
    throw new MembershipNotFoundError();
  }
  if (message.includes("INVITATION_NOT_FOUND")) {
    throw new InvitationNotFoundError();
  }
  if (message.includes("FINAL_OWNER_PROTECTED")) {
    throw new FinalOwnerProtectedError();
  }
  if (message.includes("MANAGER_CANNOT_MODIFY_OWNER")) {
    throw new ManagerCannotModifyOwnerError();
  }
  if (message.includes("ONLY_OWNER_CAN_ASSIGN_OWNER") ||
    message.includes("ONLY_OWNER_CAN_MODIFY_OWNER")) {
    throw new OnlyOwnerCanAssignOwnerError();
  }
  if (message.includes("LAST_ACTIVE_BRANCH")) {
    throw new BranchOperationError(
      ErrorCodes.Resource.Conflict,
      "Cannot deactivate the only active branch.",
    );
  }
  if (message.includes("PRIMARY_BRANCH_REQUIRES_REASSIGNMENT")) {
    throw new BranchOperationError(
      ErrorCodes.Resource.Conflict,
      "Reassign primary branch before deactivating this branch.",
    );
  }
  if (message.includes("BRANCH_INACTIVE")) {
    throw new BranchOperationError(
      ErrorCodes.Resource.Conflict,
      "Cannot make an inactive branch primary.",
    );
  }
  if (message.includes("INVITATION_REVOKED")) {
    throw new InvitationOperationError("Invitation has been revoked.");
  }
  if (message.includes("INVITATION_ALREADY_ACCEPTED")) {
    throw new InvitationOperationError("Invitation has already been accepted.");
  }
  if (message.includes("INVITATION_EXPIRED")) {
    throw new InvitationOperationError("Invitation has expired.");
  }
  if (message.includes("INVITATION_EMAIL_MISMATCH")) {
    throw new InvitationOperationError(
      "Invitation email does not match your account email.",
    );
  }
  if (message.includes("ALREADY_ACTIVE_MEMBER")) {
    throw new MembershipOperationError(
      "You are already an active member of this business.",
    );
  }
  if (message.includes("MEMBERSHIP_NOT_ACTIVE")) {
    throw new MembershipOperationError("Membership is not active.");
  }
  if (message.includes("MEMBERSHIP_NOT_SUSPENDED")) {
    throw new MembershipOperationError("Membership is not suspended.");
  }
  if (message.includes("PERMISSION_DENIED") || message.includes("ACTOR_NOT_MEMBER")) {
    throw new AuthorizationError("You do not have permission for this action.");
  }
  throw new ConflictError(ErrorCodes.Resource.Conflict, message);
}
