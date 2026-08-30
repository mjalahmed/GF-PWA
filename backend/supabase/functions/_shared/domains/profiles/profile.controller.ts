import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { UpdateProfileRequestDto } from "./profile.schemas.ts";

export async function getMyProfileController(c: AppContext) {
  const userId = c.get("userId")!;
  const { profileService } = createRequestDependencies(c);
  const profile = await profileService.getProfile(userId);
  return successResponse(c, profile);
}

export async function updateMyProfileController(c: AppContext) {
  const userId = c.get("userId")!;
  const body = (c.get("validatedBody" as never) ?? {}) as UpdateProfileRequestDto;
  const { profileService } = createRequestDependencies(c);
  const profile = await profileService.updateProfile(
    userId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, profile);
}
