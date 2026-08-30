import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { BusinessIdParamsDto } from "./business.schemas.ts";
import type {
  BranchParamsDto,
  CreateBranchRequestDto,
  UpdateBranchRequestDto,
} from "./branch.schemas.ts";

export async function listBranchesController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const { branchService } = createRequestDependencies(c);
  const branches = await branchService.list(businessId);
  return successResponse(c, branches);
}

export async function createBranchController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as CreateBranchRequestDto;
  const { branchService } = createRequestDependencies(c);
  const branch = await branchService.create(
    actorId,
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, branch, 201);
}

export async function getBranchController(c: AppContext) {
  const { businessId, branchId } = (c.get("validatedParams" as never) ??
    {}) as BranchParamsDto;
  const { branchService } = createRequestDependencies(c);
  const branch = await branchService.getById(businessId, branchId);
  return successResponse(c, branch);
}

export async function updateBranchController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, branchId } = (c.get("validatedParams" as never) ??
    {}) as BranchParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as UpdateBranchRequestDto;
  const { branchService } = createRequestDependencies(c);
  const branch = await branchService.update(
    actorId,
    businessId,
    branchId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, branch);
}

export async function deleteBranchController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, branchId } = (c.get("validatedParams" as never) ??
    {}) as BranchParamsDto;
  const { branchService } = createRequestDependencies(c);
  const result = await branchService.deactivate(
    actorId,
    businessId,
    branchId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function makePrimaryBranchController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, branchId } = (c.get("validatedParams" as never) ??
    {}) as BranchParamsDto;
  const { branchService } = createRequestDependencies(c);
  const result = await branchService.makePrimary(
    actorId,
    businessId,
    branchId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}
