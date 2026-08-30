export type ProfileResponseDto = {
  id: string;
  fullName: string | null;
  phone: string | null;
  avatarPath: string | null;
  preferredLanguage: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type { UpdateProfileRequestDto } from "./profile.schemas.ts";
