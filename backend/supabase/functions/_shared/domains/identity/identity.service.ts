import type { ProfileService } from "../profiles/profile.service.ts";
import type { RoleRepository } from "../../repositories/authorization/role.repository.interface.ts";
import { IdentityMapper } from "./identity.mapper.ts";
import type { CurrentUserResponseDto } from "./identity.dto.ts";

export class IdentityService {
  constructor(
    private readonly profileService: ProfileService,
    private readonly roleRepository: RoleRepository,
  ) {}

  async getCurrentUser(
    userId: string,
    email: string | null,
  ): Promise<CurrentUserResponseDto> {
    const profile = await this.profileService.getProfile(userId);
    const roles = await this.roleRepository.getRolesForUser(userId);
    const permissions = await this.roleRepository.getPermissionsForUser(userId);
    return IdentityMapper.toCurrentUserDto({
      id: userId,
      email,
      profile,
      roles,
      permissions,
    });
  }
}
