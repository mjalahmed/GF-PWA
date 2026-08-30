/**
 * Phase 10 disputes unit tests.
 */
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ApiContract } from "../functions/_shared/contracts/api-contract.ts";
import { Permissions } from "../functions/_shared/core/constants/permissions.ts";
import {
  DisputeActorTypes,
  DisputeReasonCodes,
  DisputeResolutionCodes,
  DisputeResolutionActionTypes,
  DisputeStatuses,
} from "../functions/_shared/core/constants/statuses.ts";
import { ErrorCodes } from "../functions/_shared/core/constants/error-codes.ts";
import {
  permissionsForMembershipRole,
} from "../functions/_shared/core/auth/business-authorization.middleware.ts";
import {
  DisputeMapper,
  formatDisputePartyDisplayName,
} from "../functions/_shared/domains/disputes/dispute.mapper.ts";
import {
  assertAtLeastOneDisputeSource,
  assertDisputeSourceGraph,
  assertDisputeTransition,
  assertDisputeWindowOpen,
  assertWithdrawAllowed,
  canSendDisputeMessage,
  DISPUTE_REASON_CODE_VALUES,
  DISPUTE_STATUS_TRANSITIONS,
  isDisputeWindowExpired,
  latestDisputeWindowEvent,
  validateReasonCode,
} from "../functions/_shared/domains/disputes/dispute.transitions.ts";
import type { DisputeRecord } from "../functions/_shared/domains/disputes/dispute.types.ts";
import {
  DisputeInvalidSourceError,
  DisputeInvalidTransitionError,
  DisputeWithdrawNotAllowedError,
  DisputeWindowExpiredError,
} from "../functions/_shared/domains/disputes/dispute.errors.ts";

Deno.test("ApiContract exposes Phase 10 dispute routes", () => {
  assertEquals(ApiContract.routes.disputes, "/disputes");
  assertEquals(ApiContract.routes.disputeWithdraw, "/disputes/:disputeId/withdraw");
  assertEquals(
    ApiContract.routes.businessDisputes,
    "/businesses/:businessId/disputes",
  );
  assertEquals(ApiContract.routes.adminDisputes, "/admin/disputes");
  assertEquals(
    ApiContract.routes.adminDisputeResolve,
    "/admin/disputes/:disputeId/resolve",
  );
});

Deno.test("Phase 10 dispute permissions exist", () => {
  assertEquals(Permissions.Dispute.Create, "dispute.create");
  assertEquals(Permissions.Dispute.ReadAll, "dispute.read_all");
  assertEquals(Permissions.Dispute.InternalNote, "dispute.internal_note");
  assertEquals(Permissions.BusinessDispute.Read, "business.dispute.read");
  assertEquals(Permissions.BusinessDispute.Create, "business.dispute.create");
});

Deno.test("business staff can read/respond disputes; managers can create", () => {
  const staff = permissionsForMembershipRole("service_advisor");
  const manager = permissionsForMembershipRole("manager");
  assertEquals(staff.includes(Permissions.BusinessDispute.Read), true);
  assertEquals(staff.includes(Permissions.BusinessDispute.Respond), true);
  assertEquals(staff.includes(Permissions.BusinessDispute.Evidence), true);
  assertEquals(staff.includes(Permissions.BusinessDispute.Create), false);
  assertEquals(manager.includes(Permissions.BusinessDispute.Create), true);
});

Deno.test("Dispute status and code registries", () => {
  assertEquals(DisputeStatuses.AwaitingBusiness, "awaiting_business");
  assertEquals(DisputeActorTypes.Customer, "customer");
  assertEquals(DisputeReasonCodes.UnexpectedCharge, "unexpected_charge");
  assertEquals(DisputeResolutionCodes.MutualResolution, "mutual_resolution");
  assertEquals(
    DisputeResolutionActionTypes.RequestedCustomerResponse,
    "requested_customer_response",
  );
  assertEquals(DISPUTE_REASON_CODE_VALUES.length, 14);
});

Deno.test("ErrorCodes dispute registry", () => {
  assertEquals(ErrorCodes.Dispute.AlreadyExists, "DISPUTE_ALREADY_EXISTS");
  assertEquals(ErrorCodes.Dispute.WindowExpired, "DISPUTE_WINDOW_EXPIRED");
  assertEquals(ErrorCodes.Dispute.InvalidTransition, "INVALID_DISPUTE_TRANSITION");
});

Deno.test("dispute status transitions follow Phase 10 machine", () => {
  assertEquals(
    DISPUTE_STATUS_TRANSITIONS[DisputeStatuses.Opened],
    [
      DisputeStatuses.AwaitingBusiness,
      DisputeStatuses.UnderReview,
      DisputeStatuses.Rejected,
      DisputeStatuses.Withdrawn,
    ],
  );
  assertDisputeTransition(
    DisputeStatuses.UnderReview,
    DisputeStatuses.Resolved,
  );
  assertThrows(
    () => assertDisputeTransition(DisputeStatuses.Closed, DisputeStatuses.Opened),
    DisputeInvalidTransitionError,
  );
});

Deno.test("validateReasonCode accepts registry values", () => {
  validateReasonCode(DisputeReasonCodes.Other);
  assertThrows(
    () => validateReasonCode("not_a_reason"),
    DisputeInvalidSourceError,
  );
});

Deno.test("source graph validation enforces customer/business match", () => {
  assertThrows(
    () => assertAtLeastOneDisputeSource({}),
    DisputeInvalidSourceError,
  );

  assertDisputeSourceGraph({
    customerId: "c1",
    businessId: "b1",
    sources: { invoiceId: "inv-1" },
    invoice: { customerId: "c1", businessId: "b1" },
  });

  assertThrows(
    () =>
      assertDisputeSourceGraph({
        customerId: "c1",
        businessId: "b1",
        sources: { paymentId: "pay-1", invoiceId: "inv-1" },
        payment: {
          customerId: "c1",
          businessId: "b1",
          invoiceId: "inv-2",
        },
      }),
    DisputeInvalidSourceError,
  );
});

Deno.test("dispute window helper uses latest relevant event", () => {
  const anchor = latestDisputeWindowEvent({
    invoicePaidAt: "2026-01-01T00:00:00.000Z",
    reviewCreatedAt: "2026-02-01T00:00:00.000Z",
  });
  assertEquals(anchor, "2026-02-01T00:00:00.000Z");

  const recent = "2026-06-01T00:00:00.000Z";
  assertEquals(
    isDisputeWindowExpired({ invoicePaidAt: recent }, Date.parse("2026-07-01T00:00:00.000Z")),
    false,
  );
  assertEquals(
    isDisputeWindowExpired({ invoicePaidAt: recent }, Date.parse("2026-10-15T00:00:00.000Z")),
    true,
  );
});

Deno.test("withdraw rules enforce customer-only pre-review", () => {
  assertWithdrawAllowed({
    status: DisputeStatuses.AwaitingBusiness,
    customerId: "cust",
    actorUserId: "cust",
    openedByType: DisputeActorTypes.Customer,
  });
  assertThrows(
    () =>
      assertWithdrawAllowed({
        status: DisputeStatuses.UnderReview,
        customerId: "cust",
        actorUserId: "cust",
        openedByType: DisputeActorTypes.Customer,
      }),
    DisputeWithdrawNotAllowedError,
  );
});

Deno.test("formatDisputePartyDisplayName and mapper privacy", () => {
  assertEquals(formatDisputePartyDisplayName("Jane Doe"), "Jane D.");
  assertEquals(formatDisputePartyDisplayName(null), "Participant");

  const record: DisputeRecord = {
    id: "d1",
    disputeNumber: "DSP-2026-000001",
    openedBy: "cust",
    openedByType: DisputeActorTypes.Customer,
    customerId: "cust",
    businessId: "biz",
    appointmentId: null,
    quotationId: null,
    invoiceId: "inv",
    paymentId: null,
    reviewId: null,
    reasonCode: DisputeReasonCodes.Other,
    summary: "Issue",
    description: null,
    status: DisputeStatuses.AwaitingBusiness,
    assignedAdminId: null,
    resolutionCode: null,
    resolutionSummary: null,
    internalNotes: "secret",
    openedAt: "2026-01-01T00:00:00.000Z",
    resolvedAt: null,
    closedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    messages: [
      {
        id: "m1",
        disputeId: "d1",
        senderUserId: "admin",
        senderType: DisputeActorTypes.Admin,
        message: "internal",
        isInternal: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        senderDisplayName: "Admin User",
      },
      {
        id: "m2",
        disputeId: "d1",
        senderUserId: "cust",
        senderType: DisputeActorTypes.Customer,
        message: "hello",
        isInternal: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        senderDisplayName: "Jane Doe",
      },
    ],
  };

  const customer = DisputeMapper.toCustomerDto(record);
  assertEquals(customer.messages.length, 1);
  assertEquals(customer.messages[0]?.message, "hello");
  assertEquals("internalNotes" in customer, false);

  const admin = DisputeMapper.toAdminDto(record);
  assertEquals(admin.messages.length, 2);
  assertEquals(admin.internalNotes, "secret");
});

Deno.test("canSendDisputeMessage blocks terminal outcomes", () => {
  assertEquals(canSendDisputeMessage(DisputeStatuses.AwaitingBusiness), true);
  assertEquals(canSendDisputeMessage(DisputeStatuses.Resolved), false);
  assertEquals(canSendDisputeMessage(DisputeStatuses.Closed), false);
});

Deno.test("assertDisputeWindowOpen throws when expired", () => {
  assertThrows(
    () =>
      assertDisputeWindowOpen({
        invoicePaidAt: "2020-01-01T00:00:00.000Z",
      }),
    DisputeWindowExpiredError,
  );
});
