import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import type { RoleRepository } from "./role.repository.interface.ts";

export class SupabaseRoleRepository implements RoleRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getRolesForUser(userId: string): Promise<string[]> {
    const { data, error } = await this.client.rpc("get_user_roles", {
      target_user_id: userId,
    });
    if (error) throw new InternalError("Failed to load roles.", error);
    return (data as string[] | null) ?? [];
  }

  async getPermissionsForUser(userId: string): Promise<string[]> {
    const { data, error } = await this.client.rpc("get_user_permissions", {
      target_user_id: userId,
    });
    if (error) throw new InternalError("Failed to load permissions.", error);
    return (data as string[] | null) ?? [];
  }
}
