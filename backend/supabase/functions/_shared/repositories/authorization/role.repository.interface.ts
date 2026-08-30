export interface RoleRepository {
  getRolesForUser(userId: string): Promise<string[]>;
  getPermissionsForUser(userId: string): Promise<string[]>;
}
