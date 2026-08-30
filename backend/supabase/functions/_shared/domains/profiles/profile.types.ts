import type { UserStatus } from "../../core/constants/statuses.ts";

export type ProfileRecord = {
  id: string;
  fullName: string | null;
  phone: string | null;
  avatarPath: string | null;
  preferredLanguage: string;
  status: UserStatus | string;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProfilePersistenceInput = {
  fullName?: string;
  phone?: string | null;
  avatarPath?: string | null;
  preferredLanguage?: string;
};
