import type { Context } from "npm:hono@4.6.14";
import type { StatusCode } from "npm:hono@4.6.14/utils/http-status";
import type { AppVariables } from "../types/context.ts";
import { AppError } from "../errors/app-error.ts";
import { ErrorCodes } from "../constants/error-codes.ts";
import { logger } from "../logging/logger.ts";
import { failureResponse } from "../responses/response.ts";

type AppContext = Context<{ Variables: AppVariables }>;

export function handleAppError(err: unknown, c: AppContext) {
  if (err instanceof AppError) {
    logger.warn({
      requestId: c.get("requestId"),
      method: c.req.method,
      path: c.req.path,
      userId: c.get("userId"),
      status: err.status,
      errorCode: err.code,
      message: err.message,
    });
    return failureResponse(
      c,
      err.code,
      err.expose ? err.message : "Something went wrong. Please try again.",
      err.status as StatusCode,
      err.details,
    );
  }

  logger.error({
    requestId: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    userId: c.get("userId"),
    status: 500,
    errorCode: ErrorCodes.Internal.Unexpected,
    message: err instanceof Error ? err.message : "unknown",
    stack: err instanceof Error ? err.stack : undefined,
  });

  return failureResponse(
    c,
    ErrorCodes.Internal.Unexpected,
    "Something went wrong. Please try again.",
    500,
  );
}
