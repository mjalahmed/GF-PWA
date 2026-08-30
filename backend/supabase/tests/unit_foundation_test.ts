import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  assertUniqueRoleValues,
  ROLE_CODES,
  Roles,
} from "../functions/_shared/core/constants/roles.ts";
import {
  assertUniquePermissionValues,
  flattenPermissionCodes,
  Permissions,
} from "../functions/_shared/core/constants/permissions.ts";
import {
  assertUniqueErrorCodes,
  ERROR_CODE_VALUES,
  ErrorCodes,
} from "../functions/_shared/core/constants/error-codes.ts";
import { assertUniqueStatusRegistries, UserStatuses } from "../functions/_shared/core/constants/statuses.ts";
import { updateProfileSchema } from "../functions/_shared/domains/profiles/profile.schemas.ts";
import { ProfileMapper } from "../functions/_shared/domains/profiles/profile.mapper.ts";
import { IdentityMapper } from "../functions/_shared/domains/identity/identity.mapper.ts";
import { ProfileService } from "../functions/_shared/domains/profiles/profile.service.ts";
import type { ProfileRepository } from "../functions/_shared/domains/profiles/profile.repository.interface.ts";
import type { ProfileRecord } from "../functions/_shared/domains/profiles/profile.types.ts";
import type { AuditRepository } from "../functions/_shared/repositories/audit/audit.repository.interface.ts";
import { openApiDocument } from "../functions/_shared/contracts/openapi.ts";
import { ApiContract } from "../functions/_shared/contracts/api-contract.ts";
import { AuthorizationService } from "../functions/_shared/repositories/authorization/authorization.service.ts";

Deno.test("role registry values are unique", () => {
  assertUniqueRoleValues();
  assertEquals(ROLE_CODES.includes(Roles.SuperAdmin), true);
});

Deno.test("permission registry values are unique", () => {
  assertUniquePermissionValues();
  assertEquals(
    flattenPermissionCodes().includes(Permissions.Audit.Read),
    true,
  );
});

Deno.test("error code registry values are unique", () => {
  assertUniqueErrorCodes();
  assertEquals(
    ERROR_CODE_VALUES.includes(ErrorCodes.Authentication.HeaderMissing),
    true,
  );
});

Deno.test("status registries have unique values", () => {
  assertUniqueStatusRegistries();
  assertEquals(UserStatuses.Active, "active");
});

Deno.test("updateProfileSchema rejects protected fields", () => {
  const result = updateProfileSchema.safeParse({ status: "suspended" });
  assertEquals(result.success, false);
});

Deno.test("updateProfileSchema accepts allowed camelCase fields", () => {
  const result = updateProfileSchema.safeParse({
    fullName: "Ali Hassan",
    preferredLanguage: "ar",
  });
  assertEquals(result.success, true);
});

Deno.test("ProfileMapper emits camelCase DTO", () => {
  const dto = ProfileMapper.toResponseDto({
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "A",
    phone: null,
    avatarPath: null,
    preferredLanguage: "en",
    status: "active",
    lastActiveAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  });
  assertEquals(dto.fullName, "A");
  assertEquals("full_name" in dto, false);
});

Deno.test("IdentityMapper builds current user DTO", () => {
  const me = IdentityMapper.toCurrentUserDto({
    id: "u1",
    email: "a@b.c",
    profile: {
      id: "u1",
      fullName: "A",
      phone: null,
      avatarPath: null,
      preferredLanguage: "en",
      status: "active",
      createdAt: "t",
      updatedAt: "t",
    },
    roles: [Roles.Customer],
    permissions: [Permissions.Profile.ReadOwn],
  });
  assertEquals(me.roles[0], "customer");
});

Deno.test("ProfileService uses repository interface (fake)", async () => {
  const record: ProfileRecord = {
    id: "u1",
    fullName: "Before",
    phone: null,
    avatarPath: null,
    preferredLanguage: "en",
    status: "active",
    lastActiveAt: null,
    createdAt: "t",
    updatedAt: "t",
  };

  const fakeProfile: ProfileRepository = {
    findByUserId: async () => record,
    updateByUserId: async (_id, input) => ({
      ...record,
      fullName: input.fullName ?? record.fullName,
      updatedAt: "t2",
    }),
  };

  let audited = false;
  const fakeAudit: AuditRepository = {
    write: async () => {
      audited = true;
    },
  };

  const service = new ProfileService(fakeProfile, fakeAudit);
  const updated = await service.updateProfile("u1", { fullName: "After" }, "req");
  assertEquals(updated.fullName, "After");
  assertEquals(audited, true);
});

Deno.test("OpenAPI document is valid JSON shape", () => {
  assertEquals(openApiDocument.openapi, "3.1.0");
  assertEquals(typeof openApiDocument.paths, "object");
  const healthPath =
    openApiDocument.paths[
      `${ApiContract.basePath}${ApiContract.routes.health}` as keyof typeof openApiDocument.paths
    ];
  assertEquals(!!healthPath, true);
});

Deno.test("ApiContract route registry is stable", () => {
  assertEquals(ApiContract.version, "v1");
  assertEquals(ApiContract.routes.currentUser, "/me");
});

Deno.test("AuthorizationService permission checks", () => {
  const svc = new AuthorizationService();
  assertEquals(svc.hasPermission(["a", "b"], ["a"]), true);
  assertEquals(svc.hasAnyPermission(["a"], ["b"]), false);
});

Deno.test("seed role codes match registry", () => {
  const seeded = [
    "customer",
    "business_owner",
    "business_manager",
    "business_staff",
    "support_agent",
    "onboarding_officer",
    "finance_operator",
    "content_moderator",
    "dispute_officer",
    "admin",
    "super_admin",
    "auditor",
  ];
  for (const code of seeded) {
    assertEquals(ROLE_CODES.includes(code as typeof ROLE_CODES[number]), true);
  }
});
