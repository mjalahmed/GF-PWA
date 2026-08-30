import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { BusinessIdParamsDto } from "../business-management/business.schemas.ts";
import type {
  CreateProductImageRequestDto,
  CreateProductRequestDto,
  ListProductsQueryDto,
  ProductImageParamsDto,
  ProductParamsDto,
  ReplaceProductCompatibilityRequestDto,
  UpdateProductRequestDto,
} from "./product.schemas.ts";

export async function listProductsController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ?? {}) as ListProductsQueryDto;
  const { productService } = createRequestDependencies(c);
  const products = await productService.list(businessId, {
    activeOnly: query.activeOnly,
    branchId: query.branchId,
    categoryId: query.categoryId,
  });
  return successResponse(c, products);
}

export async function createProductController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as CreateProductRequestDto;
  const { productService } = createRequestDependencies(c);
  const product = await productService.create(
    actorId,
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, product, 201);
}

export async function getProductController(c: AppContext) {
  const { businessId, productId } = (c.get("validatedParams" as never) ??
    {}) as ProductParamsDto;
  const { productService } = createRequestDependencies(c);
  const product = await productService.getById(businessId, productId);
  return successResponse(c, product);
}

export async function updateProductController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, productId } = (c.get("validatedParams" as never) ??
    {}) as ProductParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as UpdateProductRequestDto;
  const { productService } = createRequestDependencies(c);
  const product = await productService.update(
    actorId,
    businessId,
    productId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, product);
}

export async function deactivateProductController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, productId } = (c.get("validatedParams" as never) ??
    {}) as ProductParamsDto;
  const { productService } = createRequestDependencies(c);
  const result = await productService.deactivate(
    actorId,
    businessId,
    productId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function createProductImageController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, productId } = (c.get("validatedParams" as never) ??
    {}) as ProductParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as CreateProductImageRequestDto;
  const { productService } = createRequestDependencies(c);
  const result = await productService.registerImageMetadata(
    actorId,
    businessId,
    productId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, result, 201);
}

export async function deleteProductImageController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, productId, imageId } = (c.get("validatedParams" as never) ??
    {}) as ProductImageParamsDto;
  const { productService } = createRequestDependencies(c);
  const result = await productService.deleteImage(
    actorId,
    businessId,
    productId,
    imageId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function getProductCompatibilityController(c: AppContext) {
  const { businessId, productId } = (c.get("validatedParams" as never) ??
    {}) as ProductParamsDto;
  const { productService } = createRequestDependencies(c);
  const items = await productService.getCompatibility(businessId, productId);
  return successResponse(c, items);
}

export async function replaceProductCompatibilityController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, productId } = (c.get("validatedParams" as never) ??
    {}) as ProductParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as ReplaceProductCompatibilityRequestDto;
  const { productService } = createRequestDependencies(c);
  const items = await productService.replaceCompatibility(
    actorId,
    businessId,
    productId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, items);
}
