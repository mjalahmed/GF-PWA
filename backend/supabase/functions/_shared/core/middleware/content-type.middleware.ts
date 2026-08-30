import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { AppVariables } from "../types/context.ts";
import { AppError } from "../errors/app-error.ts";
import { ErrorCodes } from "../constants/error-codes.ts";

export const contentTypeMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    if (["POST", "PUT", "PATCH"].includes(c.req.method)) {
      const contentType = c.req.header("Content-Type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new AppError({
          code: ErrorCodes.Validation.UnsupportedMediaType,
          message: "Content-Type must be application/json.",
          status: 415,
        });
      }
    }
    await next();
  },
);
