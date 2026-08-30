import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { AppVariables } from "../types/context.ts";
import { logger } from "../logging/logger.ts";

export const loggingMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const started = Date.now();
    await next();
    logger.info({
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      userId: c.get("userId"),
      status: c.res.status,
      durationMs: Date.now() - started,
      errorCode: null,
    });
  },
);
