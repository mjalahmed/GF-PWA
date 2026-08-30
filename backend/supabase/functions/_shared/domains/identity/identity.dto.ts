import type { ProfileResponseDto } from "../profiles/profile.dto.ts";

export type CurrentUserResponseDto = {
  id: string;
  email: string | null;
  profile: ProfileResponseDto;
  roles: string[];
  permissions: string[];
};
