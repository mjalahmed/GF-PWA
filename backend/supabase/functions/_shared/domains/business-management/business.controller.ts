import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type {
  BusinessIdParamsDto,
  UpdateBusinessRequestDto,
  UpdateBusinessSettingsRequestDto,
} from "./business.schemas.ts";

export async function getBusinessController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const { businessService } = createRequestDependencies(c);
  const business = await businessService.getById(businessId);
  return successResponse(c, business);
}

export async function getPublicBusinessController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const { businessService } = createRequestDependencies(c);
  const business = await businessService.getPublic(businessId);
  return successResponse(c, business);
}

export async function updateBusinessController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as UpdateBusinessRequestDto;
  const { businessService } = createRequestDependencies(c);
  const business = await businessService.updateProfile(
    actorId,
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, business);
}

export async function getBusinessSettingsController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const { businessService } = createRequestDependencies(c);
  const settings = await businessService.getSettings(businessId);
  return successResponse(c, settings);
}

export async function updateBusinessSettingsController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as UpdateBusinessSettingsRequestDto;
  const { businessService } = createRequestDependencies(c);
  const settings = await businessService.updateSettings(
    actorId,
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, settings);
}

export async function listMyBusinessMembershipsController(c: AppContext) {
  const userId = c.get("userId")!;
  const { businessService } = createRequestDependencies(c);
  const memberships = await businessService.listMyMemberships(userId);
  return successResponse(c, memberships);
}
