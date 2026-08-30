import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  BusinessApplicationStatuses,
} from "../functions/_shared/core/constants/statuses.ts";
import {
  assertApplicationStatusTransition,
  canTransitionApplicationStatus,
} from "../functions/_shared/domains/business-onboarding/business-application.errors.ts";
import {
  createApplicationSchema,
  createDocumentSchema,
  reviewDocumentSchema,
  updateApplicationSchema,
  updateBranchSchema,
} from "../functions/_shared/domains/business-onboarding/business-application.schemas.ts";
import { BusinessApplicationMapper } from "../functions/_shared/domains/business-onboarding/business-application.mapper.ts";
import { ApiContract } from "../functions/_shared/contracts/api-contract.ts";

Deno.test("canTransitionApplicationStatus allows valid workflow edges", () => {
  assertEquals(
    canTransitionApplicationStatus(
      BusinessApplicationStatuses.Draft,
      BusinessApplicationStatuses.Submitted,
    ),
    true,
  );
  assertEquals(
    canTransitionApplicationStatus(
      BusinessApplicationStatuses.Submitted,
      BusinessApplicationStatuses.UnderReview,
    ),
    true,
  );
  assertEquals(
    canTransitionApplicationStatus(
      BusinessApplicationStatuses.UnderReview,
      BusinessApplicationStatuses.Approved,
    ),
    true,
  );
  assertEquals(
    canTransitionApplicationStatus(
      BusinessApplicationStatuses.ChangesRequested,
      BusinessApplicationStatuses.Submitted,
    ),
    true,
  );
  assertEquals(
    canTransitionApplicationStatus(
      BusinessApplicationStatuses.Rejected,
      BusinessApplicationStatuses.UnderReview,
    ),
    true,
  );
});

Deno.test("canTransitionApplicationStatus rejects invalid edges", () => {
  assertEquals(
    canTransitionApplicationStatus(
      BusinessApplicationStatuses.Draft,
      BusinessApplicationStatuses.Approved,
    ),
    false,
  );
  assertEquals(
    canTransitionApplicationStatus(
      BusinessApplicationStatuses.Approved,
      BusinessApplicationStatuses.Submitted,
    ),
    false,
  );
  assertEquals(
    canTransitionApplicationStatus(
      BusinessApplicationStatuses.Withdrawn,
      BusinessApplicationStatuses.Submitted,
    ),
    false,
  );
});

Deno.test("assertApplicationStatusTransition throws on invalid transition", () => {
  assertThrows(
    () =>
      assertApplicationStatusTransition(
        BusinessApplicationStatuses.Draft,
        BusinessApplicationStatuses.Rejected,
      ),
    Error,
    "Cannot transition",
  );
});

Deno.test("createApplicationSchema rejects unknown fields", () => {
  const result = createApplicationSchema.safeParse({
    businessCategoryId: "11111111-1111-4111-8111-111111111111",
    legalName: "Legal Co",
    displayName: "Display Co",
    phone: "+97312345678",
    email: "a@example.com",
    status: "submitted",
  });
  assertEquals(result.success, false);
});

Deno.test("createApplicationSchema accepts valid camelCase payload", () => {
  const result = createApplicationSchema.safeParse({
    businessCategoryId: "11111111-1111-4111-8111-111111111111",
    legalName: "Legal Co",
    displayName: "Display Co",
    phone: "+97312345678",
    email: "a@example.com",
  });
  assertEquals(result.success, true);
});

Deno.test("updateApplicationSchema rejects snake_case fields", () => {
  const result = updateApplicationSchema.safeParse({
    legal_name: "Should Fail",
  });
  assertEquals(result.success, false);
});

Deno.test("updateBranchSchema accepts nullable branch fields", () => {
  const result = updateBranchSchema.safeParse({
    addressLine: "Road 123",
    city: "Manama",
    latitude: null,
    longitude: null,
  });
  assertEquals(result.success, true);
});

Deno.test("createDocumentSchema enforces allowed mime types", () => {
  const ok = createDocumentSchema.safeParse({
    documentRequirementId: "11111111-1111-4111-8111-111111111111",
    originalFileName: "license.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 1024,
  });
  assertEquals(ok.success, true);

  const bad = createDocumentSchema.safeParse({
    documentRequirementId: "11111111-1111-4111-8111-111111111111",
    originalFileName: "license.exe",
    mimeType: "application/octet-stream",
    fileSizeBytes: 1024,
  });
  assertEquals(bad.success, false);
});

Deno.test("reviewDocumentSchema requires rejectionReason when rejected", () => {
  const missingReason = reviewDocumentSchema.safeParse({ status: "rejected" });
  assertEquals(missingReason.success, false);

  const ok = reviewDocumentSchema.safeParse({
    status: "rejected",
    rejectionReason: "Document is expired",
  });
  assertEquals(ok.success, true);

  const approved = reviewDocumentSchema.safeParse({ status: "approved" });
  assertEquals(approved.success, true);
});

Deno.test("BusinessApplicationMapper emits camelCase application DTO", () => {
  const dto = BusinessApplicationMapper.toApplicationDto({
    id: "11111111-1111-4111-8111-111111111111",
    applicantUserId: "22222222-2222-4222-8222-222222222222",
    businessCategoryId: "33333333-3333-4333-8333-333333333333",
    legalName: "Legal",
    displayName: "Display",
    description: null,
    commercialRegistrationNumber: null,
    phone: "+97312345678",
    email: "a@example.com",
    website: null,
    status: "draft",
    currentStep: "business_information",
    submittedAt: null,
    reviewStartedAt: null,
    approvedAt: null,
    rejectedAt: null,
    withdrawnAt: null,
    changesRequestedAt: null,
    rejectionReason: null,
    changesRequestedReason: null,
    assignedReviewerId: null,
    createdBusinessId: null,
    metadata: {},
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  });
  assertEquals(dto.legalName, "Legal");
  assertEquals("legal_name" in dto, false);
  assertEquals(dto.status, "draft");
});

Deno.test("ApiContract exposes business onboarding routes", () => {
  assertEquals(
    ApiContract.routes.businessApplications,
    "/business-applications",
  );
  assertEquals(
    ApiContract.routes.businessApplicationSubmit,
    "/business-applications/:id/submit",
  );
  assertEquals(
    ApiContract.routes.businessApplicationApprove,
    "/business-applications/:id/approve",
  );
});
