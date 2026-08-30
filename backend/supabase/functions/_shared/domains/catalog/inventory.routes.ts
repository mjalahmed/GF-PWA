import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import {
  requireActiveBusiness,
  requireBusinessMembership,
  requireBusinessPermission,
} from "../../core/auth/business-authorization.middleware.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { idempotency } from "../../core/idempotency/idempotency.middleware.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import { ApiContract } from "../../contracts/api-contract.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import {
  adjustInventorySchema,
  businessIdParamsSchema,
  listInventoryQuerySchema,
  productParamsSchema,
} from "./inventory.schemas.ts";
import {
  adjustInventoryController,
  listInventoryController,
  listProductInventoryController,
} from "./inventory.controller.ts";

export const inventoryRoutes = new Hono<{ Variables: AppVariables }>();

const idempotencyRepo = (c: { get: (k: keyof AppVariables) => unknown }) =>
  createRequestDependencies(c as never).idempotencyRepository;

inventoryRoutes.get(
  ApiContract.routes.businessInventory,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Inventory.Read),
  validate({ params: businessIdParamsSchema, query: listInventoryQuerySchema }),
  (c) => listInventoryController(c),
);

inventoryRoutes.get(
  ApiContract.routes.businessProductInventory,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Inventory.Read),
  validate({ params: productParamsSchema }),
  (c) => listProductInventoryController(c),
);

inventoryRoutes.post(
  ApiContract.routes.businessProductInventoryAdjust,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Inventory.Adjust),
  validate({ params: productParamsSchema, body: adjustInventorySchema }),
  idempotency("inventory.adjust", idempotencyRepo),
  (c) => adjustInventoryController(c),
);
