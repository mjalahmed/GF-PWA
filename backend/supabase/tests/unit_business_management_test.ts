/**
 * Phase 3 business-management unit tests.
 */
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ApiContract } from "../functions/_shared/contracts/api-contract.ts";
import { Permissions } from "../functions/_shared/core/constants/permissions.ts";
import { MembershipRoles } from "../functions/_shared/core/constants/statuses.ts";
import {
  updateBusinessSchema,
  createClosureDateSchema,
  replaceOpeningHoursSchema,
} from "../functions/_shared/domains/business-management/business.schemas.ts";
import { createBranchSchema } from "../functions/_shared/domains/business-management/branch.schemas.ts";
import { createInvitationSchema } from "../functions/_shared/domains/business-management/invitation.schemas.ts";
import { hashInvitationToken } from "../functions/_shared/domains/business-management/invitation.repository.ts";
import { BusinessMapper } from "../functions/_shared/domains/business-management/business.mapper.ts";
import {
  permissionsForMembershipRole,
  canManageMembershipTarget,
} from "../functions/_shared/core/auth/business-authorization.middleware.ts";

Deno.test("ApiContract exposes business management routes", () => {
  assertEquals(ApiContract.routes.businessById, "/businesses/:businessId");
  assertEquals(
    ApiContract.routes.businessInvitationAccept,
    "/business-invitations/:token/accept",
  );
  assertEquals(
    ApiContract.routes.myBusinessMemberships,
    "/me/business-memberships",
  );
  assertEquals(
    ApiContract.routes.businessOpeningHours,
    "/businesses/:businessId/opening-hours",
  );
});

Deno.test("updateBusinessSchema rejects protected legal fields", () => {
  const rejected = updateBusinessSchema.safeParse({
    legalName: "Nope",
    displayName: "Ok Garage",
  });
  assertEquals(rejected.success, false);

  const statusRejected = updateBusinessSchema.safeParse({ status: "active" });
  assertEquals(statusRejected.success, false);

  const ok = updateBusinessSchema.safeParse({
    displayName: "Ok Garage",
    description: "Updated",
    phone: "+97317000099",
    email: "biz@garagefinder.test",
  });
  assertEquals(ok.success, true);
});

Deno.test("opening hours schema enforces closed vs open rules", () => {
  const closedOk = replaceOpeningHoursSchema.safeParse({
    branchId: null,
    schedule: [
      { dayOfWeek: 0, isClosed: true, opensAt: null, closesAt: null },
    ],
  });
  assertEquals(closedOk.success, true);

  const openMissing = replaceOpeningHoursSchema.safeParse({
    branchId: null,
    schedule: [
      { dayOfWeek: 1, isClosed: false, opensAt: null, closesAt: null },
    ],
  });
  assertEquals(openMissing.success, false);

  const inverted = replaceOpeningHoursSchema.safeParse({
    branchId: null,
    schedule: [
      { dayOfWeek: 2, isClosed: false, opensAt: "18:00", closesAt: "09:00" },
    ],
  });
  assertEquals(inverted.success, false);
});

Deno.test("closure date schema enforces full-day vs partial", () => {
  const full = createClosureDateSchema.safeParse({
    closureDate: "2026-12-25",
    isFullDay: true,
  });
  assertEquals(full.success, true);

  const partialBad = createClosureDateSchema.safeParse({
    closureDate: "2026-12-26",
    isFullDay: false,
  });
  assertEquals(partialBad.success, false);

  const partialOk = createClosureDateSchema.safeParse({
    closureDate: "2026-12-26",
    isFullDay: false,
    opensAt: "10:00",
    closesAt: "14:00",
  });
  assertEquals(partialOk.success, true);
});

Deno.test("createBranchSchema accepts valid branch", () => {
  const ok = createBranchSchema.safeParse({
    name: "Seef Branch",
    addressLine: "Road 1",
    city: "Manama",
    countryCode: "BH",
  });
  assertEquals(ok.success, true);
});

Deno.test("createInvitationSchema rejects owner role invites", () => {
  const ownerInvite = createInvitationSchema.safeParse({
    email: "mgr@garagefinder.test",
    role: "owner",
  });
  assertEquals(ownerInvite.success, false);

  const manager = createInvitationSchema.safeParse({
    email: "mgr@garagefinder.test",
    role: "manager",
  });
  assertEquals(manager.success, true);
});

Deno.test("hashInvitationToken is stable hex digest", async () => {
  const a = await hashInvitationToken("raw-token-abc");
  const b = await hashInvitationToken("raw-token-abc");
  const c = await hashInvitationToken("other");
  assertEquals(a, b);
  assertEquals(a.length, 64);
  assertEquals(a === c, false);
});

Deno.test("membership role permission map protects owners", () => {
  const ownerPerms = permissionsForMembershipRole(MembershipRoles.Owner);
  assertEquals(ownerPerms.includes(Permissions.Business.Member.AssignOwner), true);

  const managerPerms = permissionsForMembershipRole(MembershipRoles.Manager);
  assertEquals(
    managerPerms.includes(Permissions.Business.Member.AssignOwner),
    false,
  );

  assertEquals(
    canManageMembershipTarget(MembershipRoles.Manager, MembershipRoles.Owner),
    false,
  );
  assertEquals(
    canManageMembershipTarget(MembershipRoles.Owner, MembershipRoles.Manager),
    true,
  );
  assertEquals(
    canManageMembershipTarget(MembershipRoles.Staff, MembershipRoles.Staff),
    false,
  );
});

Deno.test("BusinessMapper public DTO omits private fields", () => {
  const now = new Date().toISOString();
  const publicDto = BusinessMapper.toPublicDto({
    business: {
      id: "11111111-1111-1111-1111-111111111111",
      slug: "e2e-garage",
      businessCategoryId: "22222222-2222-2222-2222-222222222222",
      legalName: "SECRET LEGAL",
      displayName: "Public Garage",
      description: "Desc",
      commercialRegistrationNumber: "CR-SECRET",
      phone: "+97317000001",
      email: "private@garagefinder.test",
      website: "https://example.com",
      status: "active",
      verificationStatus: "verified",
      sourceApplicationId: null,
      logoPath: null,
      coverPath: null,
      averageRating: 0,
      ratingCount: 0,
      approvedAt: null,
      approvedBy: null,
      suspendedAt: null,
      suspendedReason: null,
      closedAt: null,
      metadata: { secret: true },
      createdAt: now,
      updatedAt: now,
    },
    branches: [],
    openingHours: [],
  });

  assertEquals(publicDto.displayName, "Public Garage");
  assertEquals("legalName" in publicDto, false);
  assertEquals("commercialRegistrationNumber" in publicDto, false);
  assertEquals("email" in publicDto, false);
  assertEquals("metadata" in publicDto, false);
});

Deno.test("Permissions.Business management codes are registered", () => {
  assertEquals(Permissions.Business.Read, "business.read");
  assertEquals(Permissions.Business.Settings.Update, "business.settings.update");
  assertEquals(Permissions.Business.Branch.Create, "business.branch.create");
  assertEquals(Permissions.Business.Member.Invite, "business.member.invite");
  assertEquals(Permissions.Business.Schedule.Read, "business.schedule.read");
});
