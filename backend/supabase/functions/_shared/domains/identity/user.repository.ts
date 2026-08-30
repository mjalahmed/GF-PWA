import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError, NotFoundError } from "../../core/errors/app-error.ts";
import type {
  UserAuthRecord,
  UserRepository,
} from "./user.repository.interface.ts";

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  async findAuthEmail(userId: string): Promise<UserAuthRecord> {
    const { data, error } = await this.adminClient.auth.admin.getUserById(userId);
    if (error || !data.user) throw new NotFoundError("User was not found.");
    return { id: data.user.id, email: data.user.email ?? null };
  }

  async ensureExists(userId: string): Promise<void> {
    const { data, error } = await this.adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new InternalError("Failed to verify user.", error);
    if (!data) throw new NotFoundError("User was not found.");
  }
}
