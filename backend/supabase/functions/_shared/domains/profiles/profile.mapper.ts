import type { ProfileRecord } from "./profile.types.ts";
import type { ProfileResponseDto } from "./profile.dto.ts";

export const ProfileMapper = {
  toResponseDto(record: ProfileRecord): ProfileResponseDto {
    return {
      id: record.id,
      fullName: record.fullName,
      phone: record.phone,
      avatarPath: record.avatarPath,
      preferredLanguage: record.preferredLanguage,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },
};
