import { NotFoundError } from "../../core/errors/app-error.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { ProfileRepository } from "./profile.repository.interface.ts";
import type { UpdateProfileRequestDto } from "./profile.schemas.ts";
import { ProfileMapper } from "./profile.mapper.ts";
import type { ProfileResponseDto } from "./profile.dto.ts";

export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const record = await this.profileRepository.findByUserId(userId);
    if (!record) throw new NotFoundError("Profile was not found.");
    return ProfileMapper.toResponseDto(record);
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileRequestDto,
    requestId?: string,
  ): Promise<ProfileResponseDto> {
    const before = await this.profileRepository.findByUserId(userId);
    if (!before) throw new NotFoundError("Profile was not found.");

    const updated = await this.profileRepository.updateByUserId(userId, {
      fullName: input.fullName,
      phone: input.phone,
      avatarPath: input.avatarPath,
      preferredLanguage: input.preferredLanguage,
    });

    await this.auditRepository.write({
      actorUserId: userId,
      action: "profile.updated",
      entityType: "profile",
      entityId: userId,
      requestId,
      oldValues: {
        fullName: before.fullName,
        phone: before.phone,
        avatarPath: before.avatarPath,
        preferredLanguage: before.preferredLanguage,
      },
      newValues: {
        fullName: updated.fullName,
        phone: updated.phone,
        avatarPath: updated.avatarPath,
        preferredLanguage: updated.preferredLanguage,
      },
    });

    return ProfileMapper.toResponseDto(updated);
  }
}
