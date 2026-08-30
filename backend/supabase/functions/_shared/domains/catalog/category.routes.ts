import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../../core/types/context.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { ApiContract } from "../../contracts/api-contract.ts";
import { makeIdParamsSchema } from "./category.schemas.ts";
import {
  listProductCategoriesController,
  listServiceCategoriesController,
  listVehicleMakesController,
  listVehicleModelsController,
} from "./category.controller.ts";

export const categoryRoutes = new Hono<{ Variables: AppVariables }>();

categoryRoutes.get(
  ApiContract.routes.serviceCategories,
  (c) => listServiceCategoriesController(c),
);

categoryRoutes.get(
  ApiContract.routes.productCategories,
  (c) => listProductCategoriesController(c),
);

categoryRoutes.get(
  ApiContract.routes.vehicleMakes,
  (c) => listVehicleMakesController(c),
);

categoryRoutes.get(
  ApiContract.routes.vehicleModelsByMake,
  validate({ params: makeIdParamsSchema }),
  (c) => listVehicleModelsController(c),
);
