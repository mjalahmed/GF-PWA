import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { BusinessIdParamsDto } from "./business.schemas.ts";
import type {
  CreateInvitationRequestDto,
  InvitationParamsDto,
  InvitationTokenParamsDto,
} from "./invitation.schemas.ts";

export async function listInvitationsController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const { invitationService } = createRequestDependencies(c);
  const invitations = await invitationService.list(businessId);
  return successResponse(c, invitations);
}

export async function createInvitationController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as CreateInvitationRequestDto;
  const { invitationService } = createRequestDependencies(c);
  const result = await invitationService.create(
    actorId,
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, result, 201);
}

export async function revokeInvitationController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, invitationId } = (c.get("validatedParams" as never) ??
    {}) as InvitationParamsDto;
  const { invitationService } = createRequestDependencies(c);
  const invitation = await invitationService.revoke(
    actorId,
    businessId,
    invitationId,
    c.get("requestId"),
  );
  return successResponse(c, invitation);
}

export async function acceptInvitationController(c: AppContext) {
  const userId = c.get("userId")!;
  const userEmail = c.get("user")?.email ?? "";
  const { token } = (c.get("validatedParams" as never) ??
    {}) as InvitationTokenParamsDto;
  const { invitationService } = createRequestDependencies(c);
  const result = await invitationService.accept(
    userId,
    userEmail,
    token,
    c.get("requestId"),
  );
  return successResponse(c, result);
}
