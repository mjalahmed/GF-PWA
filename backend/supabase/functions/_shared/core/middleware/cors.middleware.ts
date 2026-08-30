import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { AppVariables } from "../types/context.ts";
import type { ServerEnvironment } from "../config/environment.ts";

export function corsMiddleware(env: ServerEnvironment) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const origin = c.req.header("Origin");
    const allowOrigin =
      origin && env.allowedOrigins.includes(origin)
        ? origin
        : env.appEnv === "development"
        ? (origin ?? "*")
        : env.allowedOrigins[0] ?? "null";

    if (c.req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowOrigin,
          "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers":
            "authorization, content-type, x-request-id, idempotency-key, apikey, x-client-info",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }

    await next();
    c.res.headers.set("Access-Control-Allow-Origin", allowOrigin);
    c.res.headers.set("Vary", "Origin");
  });
}
