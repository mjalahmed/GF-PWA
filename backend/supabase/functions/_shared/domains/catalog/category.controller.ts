import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { MakeIdParamsDto } from "./category.schemas.ts";

export async function listServiceCategoriesController(c: AppContext) {
  const { categoryService } = createRequestDependencies(c);
  const categories = await categoryService.listServiceCategories();
  return successResponse(c, categories);
}

export async function listProductCategoriesController(c: AppContext) {
  const { categoryService } = createRequestDependencies(c);
  const categories = await categoryService.listProductCategories();
  return successResponse(c, categories);
}

export async function listVehicleMakesController(c: AppContext) {
  const { categoryService } = createRequestDependencies(c);
  const makes = await categoryService.listVehicleMakes();
  return successResponse(c, makes);
}

export async function listVehicleModelsController(c: AppContext) {
  const { makeId } = (c.get("validatedParams" as never) ?? {}) as MakeIdParamsDto;
  const { categoryService } = createRequestDependencies(c);
  const models = await categoryService.listVehicleModels(makeId);
  return successResponse(c, models);
}
