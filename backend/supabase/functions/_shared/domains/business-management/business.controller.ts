import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type {
  AuditLogsQueryDto,
  BusinessIdParamsDto,
  TemporaryClosureRequestDto,
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

export async function closeBusinessTemporarilyController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as TemporaryClosureRequestDto;
  const { businessService } = createRequestDependencies(c);
  const business = await businessService.setTemporaryClosure(
    actorId,
    businessId,
    true,
    body.reason ?? null,
    c.get("requestId"),
  );
  return successResponse(c, business);
}

export async function reopenBusinessController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const { businessService } = createRequestDependencies(c);
  const business = await businessService.setTemporaryClosure(
    actorId,
    businessId,
    false,
    null,
    c.get("requestId"),
  );
  return successResponse(c, business);
}

export async function listBusinessAuditLogsController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ?? {}) as AuditLogsQueryDto;
  const { auditService } = createRequestDependencies(c);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const result = await auditService.listForBusiness({
    businessId,
    actorUserId: query.actorUserId,
    action: query.action,
    entityType: query.entityType,
    entityId: query.entityId,
    branchId: query.branchId,
    from: query.from,
    to: query.to,
    page,
    pageSize,
  });
  return successResponse(c, result.items, 200, {
    page,
    pageSize,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize)),
  });
}

export async function listMyBusinessMembershipsController(c: AppContext) {
  const userId = c.get("userId")!;
  const { businessService } = createRequestDependencies(c);
  const memberships = await businessService.listMyMemberships(userId);
  return successResponse(c, memberships);
}
