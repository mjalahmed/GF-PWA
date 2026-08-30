import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type {
  BusinessIdParamsDto,
  ClosureParamsDto,
  ClosureDatesQueryDto,
  CreateClosureDateRequestDto,
  OpeningHoursQueryDto,
  ReplaceOpeningHoursRequestDto,
  UpdateClosureDateRequestDto,
} from "./business.schemas.ts";

export async function getOpeningHoursController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ??
    {}) as OpeningHoursQueryDto;
  const { scheduleService } = createRequestDependencies(c);
  const hours = await scheduleService.listOpeningHours(businessId, query);
  return successResponse(c, hours);
}

export async function replaceOpeningHoursController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as ReplaceOpeningHoursRequestDto;
  const { scheduleService } = createRequestDependencies(c);
  const hours = await scheduleService.replaceOpeningHours(
    actorId,
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, hours);
}

export async function listClosureDatesController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ??
    {}) as ClosureDatesQueryDto;
  const { scheduleService } = createRequestDependencies(c);
  const closures = await scheduleService.listClosureDates(businessId, query);
  return successResponse(c, closures);
}

export async function createClosureDateController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as CreateClosureDateRequestDto;
  const { scheduleService } = createRequestDependencies(c);
  const closure = await scheduleService.createClosureDate(
    actorId,
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, closure, 201);
}

export async function updateClosureDateController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, closureId } = (c.get("validatedParams" as never) ??
    {}) as ClosureParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as UpdateClosureDateRequestDto;
  const { scheduleService } = createRequestDependencies(c);
  const closure = await scheduleService.updateClosureDate(
    actorId,
    businessId,
    closureId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, closure);
}

export async function deleteClosureDateController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, closureId } = (c.get("validatedParams" as never) ??
    {}) as ClosureParamsDto;
  const { scheduleService } = createRequestDependencies(c);
  await scheduleService.deleteClosureDate(
    actorId,
    businessId,
    closureId,
    c.get("requestId"),
  );
  return successResponse(c, { deleted: true });
}
