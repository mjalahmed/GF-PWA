import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError, NotFoundError } from "../../core/errors/app-error.ts";
import type { ProfileRepository } from "./profile.repository.interface.ts";
import type {
  ProfileRecord,
  UpdateProfilePersistenceInput,
} from "./profile.types.ts";

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_path: string | null;
  preferred_language: string;
  status: string;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
};

function toRecord(row: ProfileRow): ProfileRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    avatarPath: row.avatar_path,
    preferredLanguage: row.preferred_language,
    status: row.status,
    lastActiveAt: row.last_active_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByUserId(userId: string): Promise<ProfileRecord | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select(
        "id, full_name, phone, avatar_path, preferred_language, status, last_active_at, created_at, updated_at",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load profile.", error);
    if (!data) return null;
    return toRecord(data as ProfileRow);
  }

  async updateByUserId(
    userId: string,
    input: UpdateProfilePersistenceInput,
  ): Promise<ProfileRecord> {
    const patch: Record<string, unknown> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.avatarPath !== undefined) patch.avatar_path = input.avatarPath;
    if (input.preferredLanguage !== undefined) {
      patch.preferred_language = input.preferredLanguage;
    }

    const { data, error } = await this.client
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select(
        "id, full_name, phone, avatar_path, preferred_language, status, last_active_at, created_at, updated_at",
      )
      .single();

    if (error) throw new InternalError("Failed to update profile.", error);
    if (!data) throw new NotFoundError("Profile was not found.");
    return toRecord(data as ProfileRow);
  }
}
