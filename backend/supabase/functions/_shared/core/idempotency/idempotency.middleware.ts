import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { AppVariables } from "../types/context.ts";
import { ConflictError } from "../errors/app-error.ts";
import { ErrorCodes } from "../constants/error-codes.ts";
import { Headers } from "../constants/headers.ts";
import type { IdempotencyRepository } from "../../repositories/idempotency/idempotency.repository.interface.ts";

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function idempotency(
  operation: string,
  getRepo: (c: { get: (k: keyof AppVariables) => unknown }) => IdempotencyRepository,
) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    if (c.req.method !== "POST") {
      await next();
      return;
    }

    const key = c.req.header(Headers.idempotencyKey);
    if (!key) {
      await next();
      return;
    }

    const userId = c.get("userId");
    if (!userId) {
      await next();
      return;
    }

    const repo = getRepo(c);
    // Prefer validated body when validation middleware already consumed the stream.
    // Otherwise hash a clone of the raw body (must run before body readers).
    let rawBody = "";
    const validatedBody = c.get("validatedBody" as never) as unknown;
    if (validatedBody !== undefined) {
      rawBody = JSON.stringify(validatedBody);
    } else {
      try {
        rawBody = await c.req.raw.clone().text();
      } catch {
        rawBody = "";
      }
    }
    const requestHash = await sha256(rawBody);

    const existing = await repo.find(userId, operation, key);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new ConflictError(
          ErrorCodes.Resource.IdempotencyConflict,
          "Idempotency-Key was reused with a different request body.",
        );
      }
      return c.json(
        existing.responseBody as Record<string, unknown>,
        existing.responseStatus as 200,
      );
    }

    await next();

    if (c.res.status >= 200 && c.res.status < 300) {
      const cloned = c.res.clone();
      const body = await cloned.json();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await repo.save({
        idempotencyKey: key,
        userId,
        operation,
        requestHash,
        responseStatus: c.res.status,
        responseBody: body,
        expiresAt,
      });
    }
  });
}
