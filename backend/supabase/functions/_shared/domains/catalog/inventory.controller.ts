import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { BusinessIdParamsDto } from "../business-management/business.schemas.ts";
import type {
  AdjustInventoryRequestDto,
  ListInventoryQueryDto,
  ProductParamsDto,
} from "./inventory.schemas.ts";

export async function listInventoryController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListInventoryQueryDto;
  const { inventoryService } = createRequestDependencies(c);
  const inventory = await inventoryService.list(businessId, {
    branchId: query.branchId,
    productId: query.productId,
  });
  return successResponse(c, inventory);
}

export async function listProductInventoryController(c: AppContext) {
  const { businessId, productId } = (c.get("validatedParams" as never) ??
    {}) as ProductParamsDto;
  const { inventoryService } = createRequestDependencies(c);
  const inventory = await inventoryService.listByProduct(businessId, productId);
  return successResponse(c, inventory);
}

export async function adjustInventoryController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, productId } = (c.get("validatedParams" as never) ??
    {}) as ProductParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as AdjustInventoryRequestDto;
  const { inventoryService } = createRequestDependencies(c);
  const result = await inventoryService.adjust(
    actorId,
    businessId,
    productId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, result);
}
