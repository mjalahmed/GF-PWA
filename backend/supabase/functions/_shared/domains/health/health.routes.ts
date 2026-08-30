import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../../core/types/context.ts";
import { healthController, readyController } from "./health.controller.ts";
import { ApiContract } from "../../contracts/api-contract.ts";

export const healthRoutes = new Hono<{ Variables: AppVariables }>();

healthRoutes.get(ApiContract.routes.health, (c) => healthController(c));
healthRoutes.get(ApiContract.routes.readiness, (c) => readyController(c));
