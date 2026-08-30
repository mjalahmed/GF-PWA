import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import { getCurrentUserController } from "./identity.controller.ts";
import { ApiContract } from "../../contracts/api-contract.ts";

export const identityRoutes = new Hono<{ Variables: AppVariables }>();

identityRoutes.get(
  ApiContract.routes.currentUser,
  requireAuthentication(),
  (c) => getCurrentUserController(c),
);
