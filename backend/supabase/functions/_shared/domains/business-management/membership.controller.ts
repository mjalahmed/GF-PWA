import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { BusinessIdParamsDto } from "./business.schemas.ts";
import type {
  MembershipParamsDto,
  UpdateMembershipRoleRequestDto,
} from "./membership.schemas.ts";
import type { MembershipRole } from "./business.types.ts";

export async function listMembersController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const { membershipService } = createRequestDependencies(c);
  const members = await membershipService.list(businessId);
  return successResponse(c, members);
}

export async function updateMemberRoleController(c: AppContext) {
  const actorId = c.get("userId")!;
  const actorRole = c.get("membershipRole") as MembershipRole;
  const { businessId, membershipId } = (c.get("validatedParams" as never) ??
    {}) as MembershipParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as UpdateMembershipRoleRequestDto;
  const { membershipService } = createRequestDependencies(c);
  const result = await membershipService.updateRole(
    actorId,
    actorRole,
    businessId,
    membershipId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function suspendMemberController(c: AppContext) {
  const actorId = c.get("userId")!;
  const actorRole = c.get("membershipRole") as MembershipRole;
  const { businessId, membershipId } = (c.get("validatedParams" as never) ??
    {}) as MembershipParamsDto;
  const { membershipService } = createRequestDependencies(c);
  const result = await membershipService.suspend(
    actorId,
    actorRole,
    businessId,
    membershipId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function restoreMemberController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, membershipId } = (c.get("validatedParams" as never) ??
    {}) as MembershipParamsDto;
  const { membershipService } = createRequestDependencies(c);
  const result = await membershipService.restore(
    actorId,
    businessId,
    membershipId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function removeMemberController(c: AppContext) {
  const actorId = c.get("userId")!;
  const actorRole = c.get("membershipRole") as MembershipRole;
  const { businessId, membershipId } = (c.get("validatedParams" as never) ??
    {}) as MembershipParamsDto;
  const { membershipService } = createRequestDependencies(c);
  const result = await membershipService.remove(
    actorId,
    actorRole,
    businessId,
    membershipId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}
