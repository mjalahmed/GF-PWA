import { Hono } from "npm:hono@4.6.14";
import { z } from "npm:zod@3.24.1";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { ApiContract } from "../../contracts/api-contract.ts";
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamsSchema,
} from "./vehicle.schemas.ts";
import {
  createVehicleController,
  deactivateVehicleController,
  getVehicleController,
  listVehiclesController,
  makeVehicleDefaultController,
  updateVehicleController,
} from "./vehicle.controller.ts";

export const vehicleRoutes = new Hono<{ Variables: AppVariables }>();

const emptyBodySchema = z.object({}).strict();

vehicleRoutes.get(
  ApiContract.routes.vehicles,
  requireAuthentication(),
  (c) => listVehiclesController(c),
);

vehicleRoutes.post(
  ApiContract.routes.vehicles,
  requireAuthentication(),
  validate({ body: createVehicleSchema }),
  (c) => createVehicleController(c),
);

vehicleRoutes.get(
  ApiContract.routes.vehicleById,
  requireAuthentication(),
  validate({ params: vehicleIdParamsSchema }),
  (c) => getVehicleController(c),
);

vehicleRoutes.patch(
  ApiContract.routes.vehicleById,
  requireAuthentication(),
  validate({ params: vehicleIdParamsSchema, body: updateVehicleSchema }),
  (c) => updateVehicleController(c),
);

vehicleRoutes.delete(
  ApiContract.routes.vehicleById,
  requireAuthentication(),
  validate({ params: vehicleIdParamsSchema }),
  (c) => deactivateVehicleController(c),
);

vehicleRoutes.post(
  ApiContract.routes.vehicleMakeDefault,
  requireAuthentication(),
  validate({ params: vehicleIdParamsSchema, body: emptyBodySchema }),
  (c) => makeVehicleDefaultController(c),
);
