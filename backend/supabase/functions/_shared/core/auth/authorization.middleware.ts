import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { AppVariables } from "../types/context.ts";
import { AuthorizationError } from "../errors/app-error.ts";
import { Roles } from "../constants/roles.ts";

export function requireRole(...roles: string[]) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const userRoles = c.get("roles") ?? [];
    if (userRoles.includes(Roles.SuperAdmin)) {
      await next();
      return;
    }
    const ok = roles.some((role) => userRoles.includes(role));
    if (!ok) throw new AuthorizationError("Missing required role.");
    await next();
  });
}

export function requirePermission(...permissions: string[]) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const userRoles = c.get("roles") ?? [];
    if (userRoles.includes(Roles.SuperAdmin)) {
      await next();
      return;
    }
    const userPermissions = c.get("permissions") ?? [];
    const ok = permissions.every((p) => userPermissions.includes(p));
    if (!ok) throw new AuthorizationError("Missing required permission.");
    await next();
  });
}

export function requireAnyPermission(...permissions: string[]) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    const userRoles = c.get("roles") ?? [];
    if (userRoles.includes(Roles.SuperAdmin)) {
      await next();
      return;
    }
    const userPermissions = c.get("permissions") ?? [];
    const ok = permissions.some((p) => userPermissions.includes(p));
    if (!ok) throw new AuthorizationError("Missing required permission.");
    await next();
  });
}
