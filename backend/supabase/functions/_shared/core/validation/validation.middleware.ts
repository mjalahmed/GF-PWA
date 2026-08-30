import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { ZodTypeAny } from "npm:zod@3.24.1";
import type { AppVariables } from "../types/context.ts";
import { ValidationError } from "../errors/app-error.ts";

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export function validate(schemas: Schemas) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const details: Array<{ field: string; message: string }> = [];

    if (schemas.params) {
      const parsed = schemas.params.safeParse(c.req.param());
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          details.push({
            field: issue.path.join(".") || "params",
            message: issue.message,
          });
        }
      } else {
        c.set("validatedParams" as never, parsed.data as never);
      }
    }

    if (schemas.query) {
      const parsed = schemas.query.safeParse(c.req.query());
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          details.push({
            field: issue.path.join(".") || "query",
            message: issue.message,
          });
        }
      } else {
        c.set("validatedQuery" as never, parsed.data as never);
      }
    }

    if (schemas.body) {
      let raw: unknown;
      try {
        raw = await c.req.json();
      } catch {
        throw new ValidationError("Request body must be valid JSON.");
      }
      const parsed = schemas.body.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          details.push({
            field: issue.path.join(".") || "body",
            message: issue.message,
          });
        }
      } else {
        c.set("validatedBody" as never, parsed.data as never);
      }
    }

    if (details.length > 0) {
      throw new ValidationError("The request contains invalid data.", details);
    }

    await next();
  });
}
