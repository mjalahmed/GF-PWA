import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { AppVariables } from "../types/context.ts";

export const requestIdMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const incoming = c.req.header("X-Request-ID");
    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const requestId = incoming && uuidRe.test(incoming)
      ? incoming
      : crypto.randomUUID();
    c.set("requestId", requestId);
    await next();
    c.header("X-Request-ID", requestId);
  },
);
