import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { AppVariables } from "../types/context.ts";

export const securityHeadersMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    await next();
    c.res.headers.set("X-Content-Type-Options", "nosniff");
    c.res.headers.set("Cache-Control", "no-store");
    c.res.headers.set("Referrer-Policy", "no-referrer");
    c.res.headers.set("X-Request-ID", c.get("requestId") ?? "");
  },
);
