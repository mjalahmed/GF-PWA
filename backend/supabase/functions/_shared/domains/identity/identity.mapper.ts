import type { ProfileResponseDto } from "../profiles/profile.dto.ts";
import type { CurrentUserResponseDto } from "./identity.dto.ts";

export const IdentityMapper = {
  toCurrentUserDto(input: {
    id: string;
    email: string | null;
    profile: ProfileResponseDto;
    roles: string[];
    permissions: string[];
  }): CurrentUserResponseDto {
    return {
      id: input.id,
      email: input.email,
      profile: input.profile,
      roles: input.roles,
      permissions: input.permissions,
    };
  },
};
