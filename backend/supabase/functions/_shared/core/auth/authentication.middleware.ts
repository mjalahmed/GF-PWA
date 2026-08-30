import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { AppVariables } from "../types/context.ts";
import type { ServerEnvironment } from "../config/environment.ts";
import { AuthenticationError } from "../errors/app-error.ts";
import { ErrorCodes } from "../constants/error-codes.ts";
import { SupabaseRoleRepository } from "../../repositories/authorization/supabase-role.repository.ts";

export function createAdminClient(env: ServerEnvironment) {
  return createClient(env.supabaseUrl, env.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createUserClient(env: ServerEnvironment, accessToken: string) {
  return createClient(env.supabaseUrl, env.publishableKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function optionalAuthentication(env: ServerEnvironment) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    c.set("supabaseAdminClient", createAdminClient(env));
    c.set("accessToken", null);
    c.set("user", null);
    c.set("userId", null);
    c.set("roles", []);
    c.set("permissions", []);
    c.set("supabaseUserClient", null);
    c.set("businessId", null);
    c.set("businessStatus", null);
    c.set("membershipId", null);
    c.set("membershipRole", null);
    c.set("businessPermissions", []);

    const header = c.req.header("Authorization");
    if (!header) {
      await next();
      return;
    }

    if (!header.startsWith("Bearer ")) {
      throw new AuthenticationError(
        ErrorCodes.Authentication.SchemeInvalid,
        "Authorization scheme must be Bearer.",
      );
    }

    const accessToken = header.slice("Bearer ".length).trim();
    if (!accessToken) {
      throw new AuthenticationError(
        ErrorCodes.Authentication.TokenInvalid,
        "Access token is invalid.",
      );
    }

    const userClient = createUserClient(env, accessToken);
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user) {
      const expired = (error?.message ?? "").toLowerCase().includes("expired");
      throw new AuthenticationError(
        expired
          ? ErrorCodes.Authentication.TokenExpired
          : ErrorCodes.Authentication.TokenInvalid,
        expired ? "Access token has expired." : "Access token is invalid.",
      );
    }

    const roleRepo = new SupabaseRoleRepository(userClient);
    const roles = await roleRepo.getRolesForUser(data.user.id);
    const permissions = await roleRepo.getPermissionsForUser(data.user.id);

    c.set("accessToken", accessToken);
    c.set("user", {
      id: data.user.id,
      email: data.user.email ?? null,
      raw: data.user,
    });
    c.set("userId", data.user.id);
    c.set("roles", roles);
    c.set("permissions", permissions);
    c.set("supabaseUserClient", userClient);
    c.set("supabaseAdminClient", createAdminClient(env));

    await next();
  });
}

export function requireAuthentication() {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    if (!c.get("userId") || !c.get("supabaseUserClient")) {
      if (!c.req.header("Authorization")) {
        throw new AuthenticationError(
          ErrorCodes.Authentication.HeaderMissing,
          "Authorization header is required.",
        );
      }
      throw new AuthenticationError(
        ErrorCodes.Authentication.Required,
        "Authentication is required.",
      );
    }
    await next();
  });
}
