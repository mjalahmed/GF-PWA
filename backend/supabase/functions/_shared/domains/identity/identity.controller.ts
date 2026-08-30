import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";

export async function getCurrentUserController(c: AppContext) {
  const userId = c.get("userId")!;
  const user = c.get("user")!;
  const { identityService } = createRequestDependencies(c);
  const me = await identityService.getCurrentUser(userId, user.email);
  return successResponse(c, me);
}
