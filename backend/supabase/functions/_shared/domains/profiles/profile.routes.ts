import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { updateProfileSchema } from "./profile.schemas.ts";
import {
  getMyProfileController,
  updateMyProfileController,
} from "./profile.controller.ts";
import { ApiContract } from "../../contracts/api-contract.ts";

export const profileRoutes = new Hono<{ Variables: AppVariables }>();

profileRoutes.get(
  ApiContract.routes.currentProfile,
  requireAuthentication(),
  (c) => getMyProfileController(c),
);

profileRoutes.patch(
  ApiContract.routes.currentProfile,
  requireAuthentication(),
  validate({ body: updateProfileSchema }),
  (c) => updateMyProfileController(c),
);
