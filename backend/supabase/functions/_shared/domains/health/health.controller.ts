import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";

export async function healthController(c: AppContext) {
  const { healthService } = createRequestDependencies(c);
  return successResponse(c, healthService.getLiveness());
}

export async function readyController(c: AppContext) {
  const { healthService } = createRequestDependencies(c);
  const data = await healthService.getReadiness(c.get("supabaseAdminClient"));
  return successResponse(c, data);
}
