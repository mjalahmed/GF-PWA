/**
 * Phase 7 quotations unit tests.
 */
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ApiContract } from "../functions/_shared/contracts/api-contract.ts";
import { Permissions } from "../functions/_shared/core/constants/permissions.ts";
import {
  QuotationItemTypes,
  QuotationStatuses,
} from "../functions/_shared/core/constants/statuses.ts";
import { ErrorCodes } from "../functions/_shared/core/constants/error-codes.ts";
import {
  calculateLine,
  calculateTotals,
  formatMoney,
  parseMoney,
  parseQuantity,
} from "../functions/_shared/domains/quotations/quotation.money.ts";
import {
  assertTransition,
  isExpired,
  REVISABLE_STATUSES,
} from "../functions/_shared/domains/quotations/quotation.transitions.ts";
import { QuotationMapper } from "../functions/_shared/domains/quotations/quotation.mapper.ts";
import type { QuotationRecord } from "../functions/_shared/domains/quotations/quotation.types.ts";
import {
  QuotationInvalidTransitionError,
  QuotationTotalInvalidError,
} from "../functions/_shared/domains/quotations/quotation.errors.ts";

Deno.test("ApiContract exposes Phase 7 quotation routes", () => {
  assertEquals(ApiContract.routes.quotations, "/quotations");
  assertEquals(
    ApiContract.routes.quotationAccept,
    "/quotations/:quotationId/accept",
  );
  assertEquals(
    ApiContract.routes.businessQuotations,
    "/businesses/:businessId/quotations",
  );
  assertEquals(
    ApiContract.routes.businessQuotationIssue,
    "/businesses/:businessId/quotations/:quotationId/issue",
  );
  assertEquals(
    ApiContract.routes.businessAppointmentQuotation,
    "/businesses/:businessId/appointments/:appointmentId/quotation",
  );
});

Deno.test("Phase 7 quotation permissions exist", () => {
  assertEquals(Permissions.Quotation.ReadOwn, "quotation.read_own");
  assertEquals(Permissions.Quotation.AcceptOwn, "quotation.accept_own");
  assertEquals(Permissions.BusinessQuotation.Issue, "business.quotation.issue");
  assertEquals(Permissions.BusinessQuotation.Revise, "business.quotation.revise");
});

Deno.test("QuotationStatuses full set", () => {
  assertEquals(QuotationStatuses.Issued, "issued");
  assertEquals(QuotationStatuses.Viewed, "viewed");
  assertEquals(QuotationStatuses.ConvertedToInvoice, "converted_to_invoice");
  assertEquals(QuotationItemTypes.Labor, "labor");
});

Deno.test("ErrorCodes quotation registry", () => {
  assertEquals(ErrorCodes.Quotation.Expired, "QUOTATION_EXPIRED");
  assertEquals(ErrorCodes.Quotation.NotEditable, "QUOTATION_NOT_EDITABLE");
  assertEquals(ErrorCodes.Quotation.TotalInvalid, "QUOTATION_TOTAL_INVALID");
});

Deno.test("parseMoney enforces BHD 3dp and rejects bad input", () => {
  assertEquals(parseMoney("84.500"), 84500);
  assertEquals(parseMoney(10), 10000);
  assertEquals(parseMoney("0.001"), 1);
  assertThrows(() => parseMoney("-1"), QuotationTotalInvalidError);
  assertThrows(() => parseMoney("1.2345"), QuotationTotalInvalidError);
  assertThrows(() => parseMoney("abc"), QuotationTotalInvalidError);
});

Deno.test("calculateLine and calculateTotals are authoritative", () => {
  const line = calculateLine({
    quantity: 2,
    unitPrice: "10.000",
    discountAmount: "1.000",
    taxAmount: "0.500",
  });
  // base 20, -1 +0.5 = 19.5
  assertEquals(formatMoney(line.lineTotalFils), 19.5);
  assertEquals(line.baseFils, 20000);

  const line2 = calculateLine({
    quantity: 1,
    unitPrice: "5.000",
    discountAmount: 0,
    taxAmount: 0,
  });
  const totals = calculateTotals([line, line2]);
  assertEquals(formatMoney(totals.subtotalFils), 25);
  assertEquals(formatMoney(totals.discountTotalFils), 1);
  assertEquals(formatMoney(totals.taxTotalFils), 0.5);
  assertEquals(formatMoney(totals.grandTotalFils), 24.5);

  assertThrows(
    () =>
      calculateLine({
        quantity: 1,
        unitPrice: "10",
        discountAmount: "11",
        taxAmount: 0,
      }),
    QuotationTotalInvalidError,
  );
});

Deno.test("parseQuantity must be positive", () => {
  assertEquals(parseQuantity("1.5"), 1500);
  assertThrows(() => parseQuantity(0), QuotationTotalInvalidError);
});

Deno.test("assertTransition quotation graph", () => {
  assertTransition(QuotationStatuses.Draft, QuotationStatuses.Issued);
  assertTransition(QuotationStatuses.Issued, QuotationStatuses.Viewed);
  assertTransition(QuotationStatuses.Viewed, QuotationStatuses.Accepted);
  assertThrows(
    () => assertTransition(QuotationStatuses.Accepted, QuotationStatuses.Draft),
    QuotationInvalidTransitionError,
  );
  assertEquals(REVISABLE_STATUSES.includes(QuotationStatuses.Rejected), true);
  assertEquals(REVISABLE_STATUSES.includes(QuotationStatuses.Accepted), false);
});

Deno.test("isExpired respects validUntil", () => {
  assertEquals(isExpired(QuotationStatuses.Issued, null, new Date()), false);
  assertEquals(
    isExpired(
      QuotationStatuses.Issued,
      "2020-01-01T00:00:00.000Z",
      new Date("2026-01-01T00:00:00.000Z"),
    ),
    true,
  );
  assertEquals(
    isExpired(
      QuotationStatuses.Issued,
      "2030-01-01T00:00:00.000Z",
      new Date("2026-01-01T00:00:00.000Z"),
    ),
    false,
  );
  assertEquals(
    isExpired(QuotationStatuses.Draft, "2020-01-01T00:00:00.000Z", new Date()),
    false,
  );
});

Deno.test("QuotationMapper hides businessNotes for customers", () => {
  const record: QuotationRecord = {
    id: "q1",
    quotationNumber: "Q-2026-000001",
    customerId: "c1",
    businessId: "b1",
    branchId: "br1",
    vehicleId: null,
    appointmentId: null,
    rootQuotationId: "q1",
    previousRevisionId: null,
    revisionNumber: 1,
    status: QuotationStatuses.Issued,
    subtotal: 10,
    discountTotal: 0,
    taxTotal: 0,
    grandTotal: 10,
    currency: "BHD",
    validUntil: null,
    customerMessage: "hi",
    businessNotes: "internal secret",
    issuedAt: "2026-08-01T00:00:00.000Z",
    viewedAt: null,
    acceptedAt: null,
    rejectedAt: null,
    cancelledAt: null,
    createdBy: "u1",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    items: [{
      id: "i1",
      quotationId: "q1",
      itemType: QuotationItemTypes.Custom,
      serviceId: null,
      productId: null,
      description: "Labor",
      quantity: 1,
      unitPrice: 10,
      discountAmount: 0,
      taxAmount: 0,
      lineTotal: 10,
      serviceNameSnapshot: null,
      productNameSnapshot: null,
      skuSnapshot: null,
      sortOrder: 0,
      createdAt: "2026-08-01T00:00:00.000Z",
    }],
  };

  const customerDto = QuotationMapper.toDto(record);
  assertEquals(customerDto.businessNotes, undefined);
  assertEquals(customerDto.grandTotal, 10);

  const businessDto = QuotationMapper.toDto(record, {
    includeBusinessNotes: true,
  });
  assertEquals(businessDto.businessNotes, "internal secret");
});
