/**
 * Adversarial tenant-isolation checks for the authorization bugs found in audit.
 * These exercise the service boundary the API calls, not only happy-path roles.
 */
import { assertEquals, assertRejects, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { effectiveBusinessPermissions, permissionsForMembershipRole } from "../functions/_shared/core/auth/business-authorization.middleware.ts";
import { Permissions } from "../functions/_shared/core/constants/permissions.ts";
import { ValidationError } from "../functions/_shared/core/errors/app-error.ts";
import { membershipCanPerformAppointmentTransition } from "../functions/_shared/domains/appointments/appointment.auth.ts";
import { assertRepairPhotoStoragePath } from "../functions/_shared/domains/appointments/appointment.media.ts";
import { AppointmentAccessDeniedError } from "../functions/_shared/domains/appointments/appointment.errors.ts";
import { AppointmentService } from "../functions/_shared/domains/appointments/appointment.service.ts";
import type { AppointmentRecord } from "../functions/_shared/domains/appointments/appointment.types.ts";
import { updateBusinessSettingsSchema } from "../functions/_shared/domains/business-management/business.schemas.ts";
import type { BusinessMembershipRecord } from "../functions/_shared/domains/business-management/business.types.ts";
import { DisputeAccessDeniedError } from "../functions/_shared/domains/disputes/dispute.errors.ts";
import { DisputeService } from "../functions/_shared/domains/disputes/dispute.service.ts";
import { InvoiceAccessDeniedError } from "../functions/_shared/domains/invoices/invoice.errors.ts";
import { InvoiceService } from "../functions/_shared/domains/invoices/invoice.service.ts";
import type { InvoiceRecord } from "../functions/_shared/domains/invoices/invoice.types.ts";
import { QuotationService } from "../functions/_shared/domains/quotations/quotation.service.ts";

const businessA = "11111111-1111-4111-8111-111111111111";
const businessB = "22222222-2222-4222-8222-222222222222";
const ownerA = "33333333-3333-4333-8333-333333333333";
const customerA = "44444444-4444-4444-8444-444444444444";
const customerB = "55555555-5555-4555-8555-555555555555";
const appointmentB = "66666666-6666-4666-8666-666666666666";
const invoiceB = "77777777-7777-4777-8777-777777777777";
const branchB = "88888888-8888-4888-8888-888888888888";
const disputeB = "99999999-9999-4999-8999-999999999999";
const staffB = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function membership(role: BusinessMembershipRecord["role"], businessId: string, userId: string): BusinessMembershipRecord {
  return {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    businessId,
    userId,
    role,
    status: "active",
    invitedBy: null,
    invitedAt: "2026-01-01T00:00:00.000Z",
    acceptedAt: "2026-01-01T00:00:00.000Z",
    suspendedAt: null,
    removedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function appointment(overrides: Partial<AppointmentRecord> = {}): AppointmentRecord {
  return {
    id: appointmentB,
    customerId: customerB,
    businessId: businessB,
    branchId: branchB,
    vehicleId: null,
    status: "requested",
    scheduledStart: "2026-10-04T09:00:00.000Z",
    scheduledEnd: "2026-10-04T10:00:00.000Z",
    customerNotes: null,
    businessNotes: null,
    cancellationReason: null,
    cancelledBy: null,
    confirmedAt: null,
    arrivedAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    services: [],
    ...overrides,
  };
}

Deno.test("global business_owner is not a member of an arbitrary business", () => {
  assertEquals(
    effectiveBusinessPermissions({
      roles: ["business_owner", "customer"],
      membershipRole: null,
    }),
    [],
  );
  const ownerPerms = effectiveBusinessPermissions({
    roles: ["customer"],
    membershipRole: "owner",
  });
  assertEquals(Array.isArray(ownerPerms) && ownerPerms.includes(Permissions.Business.Member.Read), true);
  assertEquals(
    effectiveBusinessPermissions({ roles: ["admin"], membershipRole: null }),
    "platform",
  );
});

Deno.test("appointment transitions follow the membership permission map", () => {
  assertEquals(
    membershipCanPerformAppointmentTransition({
      roles: ["business_owner"],
      membershipRole: null,
      action: "confirm",
    }),
    false,
  );
  assertEquals(
    membershipCanPerformAppointmentTransition({
      roles: ["customer"],
      membershipRole: "staff",
      action: "confirm",
    }),
    false,
  );
  assertEquals(
    membershipCanPerformAppointmentTransition({
      roles: ["customer"],
      membershipRole: "cashier",
      action: "confirm",
    }),
    false,
  );
  assertEquals(
    membershipCanPerformAppointmentTransition({
      roles: ["customer"],
      membershipRole: "owner",
      action: "confirm",
    }),
    true,
  );
  assertEquals(
    membershipCanPerformAppointmentTransition({
      roles: ["customer"],
      membershipRole: "manager",
      action: "reject",
    }),
    true,
  );
  assertEquals(
    membershipCanPerformAppointmentTransition({
      roles: ["customer"],
      membershipRole: "staff",
      action: "arrive",
    }),
    true,
  );
  assertEquals(
    membershipCanPerformAppointmentTransition({
      roles: ["customer"],
      membershipRole: "cashier",
      action: "no_show",
    }),
    true,
  );
  assertEquals(
    permissionsForMembershipRole("cashier").includes(Permissions.BusinessPayment.RecordCash),
    true,
  );
  assertEquals(
    permissionsForMembershipRole("staff").includes(Permissions.BusinessPayment.RecordCash),
    false,
  );
  assertEquals(
    membershipCanPerformAppointmentTransition({
      roles: ["admin"],
      membershipRole: null,
      action: "confirm",
    }),
    true,
  );
});

Deno.test("owner A cannot confirm an appointment at business B", async () => {
  let transitioned = false;
  const service = new AppointmentService(
    {
      findById: async () => appointment(),
      transition: async () => {
        transitioned = true;
        return appointment({ status: "confirmed" });
      },
    } as never,
    {
      findActiveMembership: async (businessId: string, userId: string) => {
        if (businessId === businessA && userId === ownerA) {
          return membership("owner", businessA, ownerA);
        }
        if (businessId === businessB && userId === staffB) {
          return membership("staff", businessB, staffB);
        }
        if (businessId === businessB && userId === ownerA) return null;
        return null;
      },
      insertNotification: async () => undefined,
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { write: async () => undefined } as never,
  );

  await assertRejects(
    () =>
      service.confirm(
        {
          userId: ownerA,
          roles: ["business_owner", "customer"],
          globalPermissions: [
            Permissions.Appointment.Confirm,
            Permissions.Appointment.Manage,
          ],
        },
        appointmentB,
        {},
      ),
    AppointmentAccessDeniedError,
  );
  assertEquals(transitioned, false);

  await assertRejects(
    () => service.confirm({ userId: staffB, roles: ["customer"] }, appointmentB, {}),
    AppointmentAccessDeniedError,
  );
  assertEquals(transitioned, false);

  await service.confirm({ userId: "admin-user", roles: ["admin"] }, appointmentB, {});
  assertEquals(transitioned, true);
});

Deno.test("quotation and invoice reject a customer with no business relationship", async () => {
  let quotationCreated = false;
  const quotations = new QuotationService(
    {
      existsForCustomerBusiness: async () => false,
      create: async () => {
        quotationCreated = true;
        return {};
      },
    } as never,
    {
      findSettings: async () => ({ quotationsEnabled: true, invoicesEnabled: true }),
      findById: async () => ({ status: "active" }),
    } as never,
    { findById: async () => ({ isActive: true }) } as never,
    {} as never,
    {} as never,
    {
      findById: async () => ({ customerId: customerA, isActive: true }),
    } as never,
    {
      findById: async () => null,
      existsForCustomerBusiness: async () => false,
    } as never,
    {} as never,
    { write: async () => undefined } as never,
  );

  await assertRejects(
    () =>
      quotations.create(
        { userId: ownerA, roles: ["customer"] },
        businessA,
        {
          customerId: customerB,
          branchId: branchB,
          items: [{
            itemType: "custom",
            description: "Oil",
            quantity: 1,
            unitPrice: 1,
          }],
        } as never,
      ),
    ValidationError,
    "Customer has no verified relationship with this business.",
  );
  assertEquals(quotationCreated, false);

  await assertRejects(
    () =>
      quotations.create(
        { userId: ownerA, roles: ["customer"] },
        businessA,
        {
          customerId: customerB,
          branchId: branchB,
          vehicleId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          items: [{
            itemType: "custom",
            description: "Oil",
            quantity: 1,
            unitPrice: 1,
          }],
        } as never,
      ),
    ValidationError,
    "Vehicle must belong to the customer.",
  );

  const invoices = new InvoiceService(
    {
      findById: async () =>
        ({
          id: invoiceB,
          customerId: customerB,
          businessId: businessB,
          items: [],
        }) as InvoiceRecord,
      existsForCustomerBusiness: async () => false,
    } as never,
    { existsForCustomerBusiness: async () => false, findById: async () => null } as never,
    {
      findSettings: async () => ({ invoicesEnabled: true, cashPaymentsEnabled: true }),
      findActiveMembership: async () => null,
      findById: async () => ({ status: "active" }),
    } as never,
    { findById: async () => ({ isActive: true }) } as never,
    {} as never,
    {} as never,
    {} as never,
    { existsForCustomerBusiness: async () => false, findById: async () => null } as never,
    {} as never,
    { write: async () => undefined } as never,
  );

  await assertRejects(
    () => invoices.getById({ userId: customerA, roles: ["customer"] }, invoiceB),
    InvoiceAccessDeniedError,
  );

  await assertRejects(
    () =>
      invoices.create(
        { userId: ownerA, roles: ["customer"] },
        businessA,
        {
          customerId: customerB,
          branchId: branchB,
          items: [{
            itemType: "custom",
            description: "Oil",
            quantity: 1,
            unitPrice: 1,
          }],
        } as never,
      ),
    ValidationError,
    "Customer has no verified relationship with this business.",
  );
});

Deno.test("dispute evidence upload is limited to a party or platform operator", async () => {
  let uploads = 0;
  const record = {
    id: disputeB,
    customerId: customerB,
    businessId: businessB,
    status: "opened",
  };
  const service = new DisputeService(
    {
      findById: async () => record,
      createEvidenceMetadata: async () => {
        uploads += 1;
        return {
          evidenceId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
          storagePath: `disputes/${disputeB}/${customerB}/e/file.jpg`,
          uploadUrl: "https://example.test/upload",
        };
      },
    } as never,
    {
      findActiveMembership: async (businessId: string, userId: string) => {
        if (businessId === businessA && userId === ownerA) {
          return membership("owner", businessA, ownerA);
        }
        return null;
      },
    } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { write: async () => undefined } as never,
  );
  const file = {
    originalFileName: "a.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 1000,
  };

  await assertRejects(
    () => service.addCustomerEvidence({ userId: customerA, roles: ["customer"] }, disputeB, file),
    DisputeAccessDeniedError,
  );
  await assertRejects(
    () =>
      service.addBusinessEvidence(
        { userId: ownerA, roles: ["business_owner"] },
        businessB,
        disputeB,
        file,
      ),
    DisputeAccessDeniedError,
  );
  assertEquals(uploads, 0);

  await service.addCustomerEvidence({ userId: customerB, roles: ["customer"] }, disputeB, file);
  await service.addBusinessEvidence(
    { userId: "admin-user", roles: ["admin"] },
    businessB,
    disputeB,
    file,
  );
  assertEquals(uploads, 2);
});

Deno.test("repair photo paths must match the appointment business", () => {
  assertThrows(
    () =>
      assertRepairPhotoStoragePath({
        businessId: businessA,
        appointmentId: appointmentB,
        phase: "before",
        storagePath: `${businessB}/${appointmentB}/before/photo.jpg`,
      }),
    ValidationError,
  );
  assertThrows(
    () =>
      assertRepairPhotoStoragePath({
        businessId: businessA,
        appointmentId: appointmentB,
        phase: "before",
        storagePath: `${businessA}/${appointmentB}/before/../secret.jpg`,
      }),
    ValidationError,
  );
  assertRepairPhotoStoragePath({
    businessId: businessA,
    appointmentId: appointmentB,
    phase: "during",
    storagePath: `${businessA}/${appointmentB}/during/photo.jpg`,
  });
});

Deno.test("settings writes accept BenefitPay fields and reject client metadata", () => {
  const parsed = updateBusinessSettingsSchema.parse({
    benefitPayEnabled: true,
    benefitPayPhone: "+97300000000",
    benefitPayIban: "BH00TEST",
    benefitPayInstructions: "Pay in the app",
    publiclyVisible: true,
    acceptNewCustomers: false,
  });
  assertEquals(parsed.benefitPayEnabled, true);
  assertThrows(() => updateBusinessSettingsSchema.parse({ metadata: { benefitPayEnabled: true } }));
});

Deno.test("tenant migration removes global permission ORs and the dispute insert policy", async () => {
  const sql = await Deno.readTextFile(
    new URL("../migrations/20261003170000_tenant_isolation_rls.sql", import.meta.url),
  );
  const forbidden = [
    "has_permission('appointment.read')",
    "has_permission('quotation.read_own')",
    "has_permission('business.quotation.read')",
    "has_permission('invoice.read_own')",
    "has_permission('business.invoice.read')",
    "has_permission('payment.read_own')",
    "has_permission('business.payment.read')",
    "has_permission('dispute.read_own')",
    "has_permission('business.dispute.read')",
    "has_permission('business.review.read')",
    "has_permission('business.service.read')",
    "has_permission('business.product.read')",
    "has_permission('business.inventory.read')",
    "has_permission('business.view')",
    "create policy dispute_evidence_storage_insert_own",
  ];
  for (const fragment of forbidden) {
    assertEquals(sql.includes(fragment), false, fragment);
  }
  assertEquals(sql.includes("drop policy if exists dispute_evidence_storage_insert_own"), true);
  assertEquals(sql.includes("repair-photos"), true);
  assertEquals(sql.includes("has_business_permission"), true);
});
