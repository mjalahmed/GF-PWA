import type { Context } from "npm:hono@4.6.14";
import type { StatusCode } from "npm:hono@4.6.14/utils/http-status";
import type { AppVariables, PaginationMeta } from "../types/context.ts";

export type AppContext = Context<{ Variables: AppVariables }>;

export type ApiErrorDto = {
  code: string;
  message: string;
  details: unknown;
};

export type PaginationMetaDto = PaginationMeta;

export function successResponse<T>(
  c: AppContext,
  data: T,
  status: StatusCode = 200,
  pagination?: PaginationMeta,
) {
  return c.json(
    {
      success: true as const,
      data,
      error: null,
      meta: {
        requestId: c.get("requestId") ?? crypto.randomUUID(),
        ...(pagination ? { pagination } : {}),
      },
    },
    status,
  );
}

export function failureResponse(
  c: AppContext,
  code: string,
  message: string,
  status: StatusCode = 400,
  details: unknown = null,
) {
  return c.json(
    {
      success: false as const,
      data: null,
      error: { code, message, details } satisfies ApiErrorDto,
      meta: { requestId: c.get("requestId") ?? crypto.randomUUID() },
    },
    status,
  );
}
