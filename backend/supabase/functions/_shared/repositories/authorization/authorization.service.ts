export class AuthorizationService {
  hasPermission(userPermissions: string[], required: string[]): boolean {
    return required.every((p) => userPermissions.includes(p));
  }

  hasAnyPermission(userPermissions: string[], required: string[]): boolean {
    return required.some((p) => userPermissions.includes(p));
  }

  hasRole(userRoles: string[], required: string[]): boolean {
    return required.some((r) => userRoles.includes(r));
  }
}
