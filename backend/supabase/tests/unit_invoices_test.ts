/**
 * Phase 8 invoices + cash payments unit tests.
 */
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ApiContract } from "../functions/_shared/contracts/api-contract.ts";
import { Permissions } from "../functions/_shared/core/constants/permissions.ts";
import {
  InvoiceItemTypes,
  InvoiceStatuses,
  PaymentMethods,
  PaymentStatuses,
} from "../functions/_shared/core/constants/statuses.ts";
import { ErrorCodes } from "../functions/_shared/core/constants/error-codes.ts";
import {
  permissionsForMembershipRole,
} from "../functions/_shared/core/auth/business-authorization.middleware.ts";
import { MembershipRoles } from "../functions/_shared/core/constants/statuses.ts";
import {
  calculateLine,
  calculateTotals,
  formatMoney,
} from "../functions/_shared/domains/quotations/quotation.money.ts";
import {
  assertInvoicePayable,
  assertTransition,
  INVOICE_REFUND_TRANSITIONS,
  validateCashPaymentAmount,
} from "../functions/_shared/domains/invoices/invoice.transitions.ts";
import { InvoiceMapper } from "../functions/_shared/domains/invoices/invoice.mapper.ts";
import type { InvoiceRecord } from "../functions/_shared/domains/invoices/invoice.types.ts";
import type { PaymentProvider } from "../functions/_shared/domains/invoices/payment.provider.ts";
import {
  InvoiceApprovalRequiredError,
  InvoiceInvalidTransitionError,
  InvoiceNotPayableError,
  InvoiceTotalInvalidError,
  PaymentAmountInvalidError,
  PaymentOverpaymentError,
} from "../functions/_shared/domains/invoices/invoice.errors.ts";

Deno.test("ApiContract exposes Phase 8 invoice and payment routes", () => {
  assertEquals(ApiContract.routes.invoices, "/invoices");
  assertEquals(
    ApiContract.routes.invoiceApprove,
    "/invoices/:invoiceId/approve",
  );
  assertEquals(
    ApiContract.routes.businessInvoices,
    "/businesses/:businessId/invoices",
  );
  assertEquals(
    ApiContract.routes.businessInvoiceCashPayment,
    "/businesses/:businessId/invoices/:invoiceId/payments/cash",
  );
  assertEquals(ApiContract.routes.payments, "/payments");
});

Deno.test("Phase 8 invoice and payment permissions exist", () => {
  assertEquals(Permissions.Invoice.ReadOwn, "invoice.read_own");
  assertEquals(Permissions.Invoice.ApproveOwn, "invoice.approve_own");
  assertEquals(Permissions.BusinessInvoice.Issue, "business.invoice.issue");
  assertEquals(Permissions.BusinessPayment.RecordCash, "business.payment.record_cash");
  assertEquals(Permissions.BusinessPayment.Refund, "business.payment.refund");
});

Deno.test("InvoiceStatuses and PaymentStatuses full Phase 8 sets", () => {
  assertEquals(InvoiceStatuses.CustomerApproved, "customer_approved");
  assertEquals(InvoiceStatuses.PartiallyRefunded, "partially_refunded");
  assertEquals(InvoiceItemTypes.Labor, "labor");
  assertEquals(PaymentStatuses.Created, "created");
  assertEquals(PaymentStatuses.RequiresAction, "requires_action");
  assertEquals(PaymentMethods.Cash, "cash");
});

Deno.test("ErrorCodes invoice and payment registry", () => {
  assertEquals(ErrorCodes.Invoice.NotPayable, "INVOICE_NOT_PAYABLE");
  assertEquals(ErrorCodes.Invoice.ApprovalRequired, "INVOICE_APPROVAL_REQUIRED");
  assertEquals(ErrorCodes.Payment.Overpayment, "PAYMENT_OVERPAYMENT");
});

Deno.test("invoice totals reuse quotation money helpers with platformFeeTotal=0", () => {
  const line = calculateLine({
    quantity: 2,
    unitPrice: "10.000",
    discountAmount: "1.000",
    taxAmount: "0.500",
  });
  const totals = calculateTotals([line]);
  const platformFeeTotal = 0;
  const grandTotal = formatMoney(totals.grandTotalFils);
  assertEquals(grandTotal, 19.5);
  assertEquals(platformFeeTotal, 0);
  assertEquals(formatMoney(totals.subtotalFils), 20);
});

Deno.test("assertTransition invoice graph and approval rules", () => {
  assertTransition(InvoiceStatuses.Draft, InvoiceStatuses.Issued);
  assertTransition(InvoiceStatuses.Issued, InvoiceStatuses.Viewed);
  assertTransition(InvoiceStatuses.Viewed, InvoiceStatuses.CustomerApproved);
  assertTransition(
    InvoiceStatuses.Issued,
    InvoiceStatuses.PartiallyPaid,
    { requiresCustomerApproval: false },
  );
  assertThrows(
    () =>
      assertTransition(
        InvoiceStatuses.Issued,
        InvoiceStatuses.PartiallyPaid,
        { requiresCustomerApproval: true },
      ),
    InvoiceApprovalRequiredError,
  );
  assertThrows(
    () => assertTransition(InvoiceStatuses.Paid, InvoiceStatuses.Draft),
    InvoiceInvalidTransitionError,
  );
  assertEquals(
    INVOICE_REFUND_TRANSITIONS[InvoiceStatuses.Paid]?.includes(
      InvoiceStatuses.Refunded,
    ),
    true,
  );
});

Deno.test("assertInvoicePayable enforces approval before cash", () => {
  assertInvoicePayable(InvoiceStatuses.Issued, false);
  assertThrows(
    () => assertInvoicePayable(InvoiceStatuses.Issued, true),
    InvoiceApprovalRequiredError,
  );
  assertInvoicePayable(InvoiceStatuses.CustomerApproved, true);
  assertThrows(
    () => assertInvoicePayable(InvoiceStatuses.Draft, false),
    InvoiceNotPayableError,
  );
});

Deno.test("validateCashPaymentAmount accepts partial and rejects overpay", () => {
  assertEquals(validateCashPaymentAmount("40.000", 100), 40);
  assertEquals(validateCashPaymentAmount(100, 100), 100);
  assertThrows(
    () => validateCashPaymentAmount(0, 100),
    PaymentAmountInvalidError,
  );
  assertThrows(
    () => validateCashPaymentAmount(101, 100),
    PaymentOverpaymentError,
  );
  assertThrows(
    () => validateCashPaymentAmount("1.2345", 100),
    InvoiceTotalInvalidError,
  );
});

Deno.test("InvoiceMapper hides businessNotes for customers", () => {
  const record: InvoiceRecord = {
    id: "inv1",
    invoiceNumber: "INV-2026-000001",
    customerId: "c1",
    businessId: "b1",
    branchId: "br1",
    vehicleId: null,
    appointmentId: null,
    quotationId: null,
    status: InvoiceStatuses.Issued,
    subtotal: 10,
    discountTotal: 0,
    taxTotal: 0,
    platformFeeTotal: 0,
    grandTotal: 10,
    paidTotal: 0,
    remainingTotal: 10,
    currency: "BHD",
    requiresCustomerApproval: false,
    dueAt: null,
    issuedAt: "2026-08-01T00:00:00.000Z",
    viewedAt: null,
    customerApprovedAt: null,
    paidAt: null,
    cancelledAt: null,
    customerMessage: "thanks",
    businessNotes: "internal only",
    createdBy: "u1",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    items: [{
      id: "i1",
      invoiceId: "inv1",
      itemType: InvoiceItemTypes.Custom,
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

  const customerDto = InvoiceMapper.toDto(record);
  assertEquals(customerDto.businessNotes, undefined);

  const businessDto = InvoiceMapper.toDto(record, { includeBusinessNotes: true });
  assertEquals(businessDto.businessNotes, "internal only");
});

Deno.test("PaymentProvider interface is defined at type level", () => {
  const stub: PaymentProvider = {
    initiatePayment: async () => ({
      providerPaymentId: "stub",
      status: PaymentStatuses.Pending,
    }),
    retrievePayment: async () => ({
      providerPaymentId: "stub",
      status: PaymentStatuses.Captured,
      amount: 1,
      currency: "BHD",
    }),
    refundPayment: async () => ({
      providerRefundId: "stub",
      status: "pending",
      amount: 1,
    }),
    verifyWebhook: async () => ({
      provider: "stub",
      eventType: "test",
      providerEventId: "evt",
      payload: {},
    }),
  };
  assertEquals(stub.initiatePayment !== undefined, true);
});

Deno.test("cashier and service_advisor get record_cash; mechanic does not", () => {
  const cashierPerms = permissionsForMembershipRole(MembershipRoles.Cashier);
  assertEquals(
    cashierPerms.includes(Permissions.BusinessPayment.RecordCash),
    true,
  );

  const advisorPerms = permissionsForMembershipRole(MembershipRoles.ServiceAdvisor);
  assertEquals(
    advisorPerms.includes(Permissions.BusinessPayment.RecordCash),
    true,
  );

  const mechanicPerms = permissionsForMembershipRole(MembershipRoles.Mechanic);
  assertEquals(
    mechanicPerms.includes(Permissions.BusinessPayment.RecordCash),
    false,
  );
  assertEquals(
    mechanicPerms.includes(Permissions.BusinessInvoice.Read),
    true,
  );
});
