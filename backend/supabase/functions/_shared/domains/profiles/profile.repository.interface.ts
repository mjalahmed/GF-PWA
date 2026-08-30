import type {
  ProfileRecord,
  UpdateProfilePersistenceInput,
} from "./profile.types.ts";

export interface ProfileRepository {
  findByUserId(userId: string): Promise<ProfileRecord | null>;

  updateByUserId(
    userId: string,
    input: UpdateProfilePersistenceInput,
  ): Promise<ProfileRecord>;
}
