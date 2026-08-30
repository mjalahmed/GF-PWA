import { createMiddleware } from "npm:hono@4.6.14/factory";
import type { Context } from "npm:hono@4.6.14";
import type { AppVariables } from "../types/context.ts";
import { AuthorizationError } from "../errors/app-error.ts";
import { Permissions } from "../constants/permissions.ts";
import { Roles } from "../constants/roles.ts";
import { BusinessStatuses } from "../constants/statuses.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { MembershipRole } from "../../domains/business-management/business.types.ts";
import { BusinessAccessDeniedError, BusinessInactiveError } from "../../domains/business-management/business.errors.ts";

const CATALOG_READ_PERMISSIONS: string[] = [
  Permissions.Business.Service.Read,
  Permissions.Business.Product.Read,
  Permissions.Business.Inventory.Read,
];

const CATALOG_WRITE_PERMISSIONS: string[] = [
  ...CATALOG_READ_PERMISSIONS,
  Permissions.Business.Service.Create,
  Permissions.Business.Service.Update,
  Permissions.Business.Service.Deactivate,
  Permissions.Business.Service.ImageManage,
  Permissions.Business.Product.Create,
  Permissions.Business.Product.Update,
  Permissions.Business.Product.Deactivate,
  Permissions.Business.Product.ImageManage,
  Permissions.Business.Inventory.Adjust,
];

const APPOINTMENT_STAFF_PERMISSIONS: string[] = [
  Permissions.Appointment.Read,
  Permissions.Appointment.Arrive,
  Permissions.Appointment.Start,
  Permissions.Appointment.Complete,
  Permissions.Appointment.NoShow,
  Permissions.Appointment.View,
];

const APPOINTMENT_MANAGER_PERMISSIONS: string[] = [
  ...APPOINTMENT_STAFF_PERMISSIONS,
  Permissions.Appointment.Confirm,
  Permissions.Appointment.Reject,
  Permissions.Appointment.Cancel,
  Permissions.Appointment.Manage,
];

const QUOTATION_STAFF_PERMISSIONS: string[] = [
  Permissions.BusinessQuotation.Read,
  Permissions.BusinessQuotation.Create,
  Permissions.BusinessQuotation.Update,
  Permissions.BusinessQuotation.Issue,
];

const QUOTATION_MANAGER_PERMISSIONS: string[] = [
  ...QUOTATION_STAFF_PERMISSIONS,
  Permissions.BusinessQuotation.Revise,
  Permissions.BusinessQuotation.Cancel,
];

const INVOICE_STAFF_PERMISSIONS: string[] = [
  Permissions.BusinessInvoice.Read,
  Permissions.BusinessInvoice.Create,
  Permissions.BusinessInvoice.Update,
  Permissions.BusinessInvoice.Issue,
  Permissions.BusinessPayment.Read,
];

const INVOICE_MANAGER_PERMISSIONS: string[] = [
  ...INVOICE_STAFF_PERMISSIONS,
  Permissions.BusinessInvoice.Cancel,
  Permissions.BusinessPayment.RecordCash,
];

const REVIEW_STAFF_PERMISSIONS: string[] = [
  Permissions.BusinessReview.Read,
];

const REVIEW_MANAGER_PERMISSIONS: string[] = [
  ...REVIEW_STAFF_PERMISSIONS,
  Permissions.BusinessReview.Respond,
];

const DISPUTE_STAFF_PERMISSIONS: string[] = [
  Permissions.BusinessDispute.Read,
  Permissions.BusinessDispute.Respond,
  Permissions.BusinessDispute.Evidence,
];

const DISPUTE_MANAGER_PERMISSIONS: string[] = [
  ...DISPUTE_STAFF_PERMISSIONS,
  Permissions.BusinessDispute.Create,
];

const RECORD_CASH_PERMISSIONS: string[] = [
  Permissions.BusinessPayment.RecordCash,
];

const STAFF_READ_PERMISSIONS: string[] = [
  Permissions.Business.Read,
  Permissions.Business.View,
  Permissions.Business.Branch.Read,
  Permissions.Business.Member.Read,
  Permissions.Business.Schedule.Read,
  Permissions.Business.PublicRead,
  Permissions.Business.Settings.Read,
  ...CATALOG_READ_PERMISSIONS,
  ...APPOINTMENT_STAFF_PERMISSIONS,
  ...QUOTATION_STAFF_PERMISSIONS,
  ...INVOICE_STAFF_PERMISSIONS,
  ...REVIEW_STAFF_PERMISSIONS,
  ...DISPUTE_STAFF_PERMISSIONS,
];

const MANAGER_PERMISSIONS: string[] = [
  ...STAFF_READ_PERMISSIONS,
  Permissions.Business.Update,
  Permissions.Business.Settings.Update,
  Permissions.Business.Branch.Create,
  Permissions.Business.Branch.Update,
  Permissions.Business.Member.Invite,
  Permissions.Business.Member.Update,
  Permissions.Business.Member.Suspend,
  Permissions.Business.Schedule.Update,
  ...CATALOG_WRITE_PERMISSIONS.filter(
    (p) => !CATALOG_READ_PERMISSIONS.includes(p),
  ),
  ...APPOINTMENT_MANAGER_PERMISSIONS.filter(
    (p) => !APPOINTMENT_STAFF_PERMISSIONS.includes(p),
  ),
  ...QUOTATION_MANAGER_PERMISSIONS.filter(
    (p) => !QUOTATION_STAFF_PERMISSIONS.includes(p),
  ),
  ...INVOICE_MANAGER_PERMISSIONS.filter(
    (p) => !INVOICE_STAFF_PERMISSIONS.includes(p),
  ),
  ...REVIEW_MANAGER_PERMISSIONS.filter(
    (p) => !REVIEW_STAFF_PERMISSIONS.includes(p),
  ),
  ...DISPUTE_MANAGER_PERMISSIONS.filter(
    (p) => !DISPUTE_STAFF_PERMISSIONS.includes(p),
  ),
];

const OWNER_PERMISSIONS: string[] = [
  ...MANAGER_PERMISSIONS,
  Permissions.Business.Branch.Delete,
  Permissions.Business.Member.Remove,
  Permissions.Business.Member.AssignOwner,
];

const NON_MANAGEMENT_ROLES: MembershipRole[] = [
  "service_advisor",
  "mechanic",
  "cashier",
  "receptionist",
  "staff",
];

const CASH_HANDLING_ROLES: MembershipRole[] = [
  "cashier",
  "service_advisor",
];

function permissionsForMembershipRole(role: MembershipRole): string[] {
  if (role === "owner") return [...OWNER_PERMISSIONS];
  if (role === "manager") return [...MANAGER_PERMISSIONS];
  if (CASH_HANDLING_ROLES.includes(role)) {
    return [...STAFF_READ_PERMISSIONS, ...RECORD_CASH_PERMISSIONS];
  }
  if (NON_MANAGEMENT_ROLES.includes(role)) return [...STAFF_READ_PERMISSIONS];
  return [...STAFF_READ_PERMISSIONS];
}

function isSuperAdmin(roles: string[]): boolean {
  return roles.includes(Roles.SuperAdmin);
}

function hasGlobalPermission(
  globalPermissions: string[],
  required: string[],
): boolean {
  return required.every((p) => globalPermissions.includes(p));
}

function hasEffectivePermission(
  c: Context<{ Variables: AppVariables }>,
  required: string[],
): boolean {
  const roles = (c.get("roles") ?? []) as string[];
  if (isSuperAdmin(roles)) return true;

  const globalPermissions = (c.get("permissions") ?? []) as string[];
  if (hasGlobalPermission(globalPermissions, required)) return true;

  const businessPermissions = (c.get("businessPermissions") ?? []) as string[];
  return required.every((p) => businessPermissions.includes(p));
}

async function loadBusinessAuthContext(
  c: Context<{ Variables: AppVariables }>,
): Promise<void> {
  const businessId = c.req.param("businessId");
  if (!businessId) {
    throw new BusinessAccessDeniedError();
  }

  const userId = c.get("userId") as string | null;
  if (!userId) {
    throw new AuthorizationError("Authentication is required.");
  }

  const { businessRepository } = createRequestDependencies(c as never);
  const business = await businessRepository.findById(businessId, "admin");
  if (!business) {
    throw new BusinessAccessDeniedError();
  }

  const membership = await businessRepository.findActiveMembership(
    businessId,
    userId,
  );

  const roles = (c.get("roles") ?? []) as string[];
  const globalPermissions = (c.get("permissions") ?? []) as string[];

  if (!membership && !isSuperAdmin(roles) &&
    !globalPermissions.includes(Permissions.Business.Read) &&
    !globalPermissions.includes(Permissions.Business.View)) {
    throw new BusinessAccessDeniedError();
  }

  c.set("businessId", businessId);
  c.set("businessStatus", business.status);
  c.set("membershipId", membership?.id ?? null);
  c.set("membershipRole", membership?.role ?? null);
  c.set(
    "businessPermissions",
    membership ? permissionsForMembershipRole(membership.role) : [],
  );
}

function canManageMembershipTarget(
  actorRole: MembershipRole,
  targetRole: MembershipRole,
): boolean {
  if (actorRole === "owner") return true;
  if (actorRole === "manager") {
    return targetRole !== "owner";
  }
  return false;
}

export function requireBusinessMembership() {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    await loadBusinessAuthContext(c);
    await next();
  });
}

export function requireBusinessRole(...roles: MembershipRole[]) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    await loadBusinessAuthContext(c);

    const userRoles = c.get("roles") ?? [];
    if (isSuperAdmin(userRoles)) {
      await next();
      return;
    }

    const membershipRole = c.get("membershipRole");
    if (!membershipRole || !roles.includes(membershipRole as MembershipRole)) {
      throw new AuthorizationError("Missing required business role.");
    }

    await next();
  });
}

export function requireBusinessPermission(...permissions: string[]) {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    await loadBusinessAuthContext(c);

    if (!hasEffectivePermission(c, permissions)) {
      throw new AuthorizationError("Missing required business permission.");
    }

    await next();
  });
}

export function requireActiveBusiness() {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    await loadBusinessAuthContext(c);

    const userRoles = c.get("roles") ?? [];
    if (isSuperAdmin(userRoles)) {
      await next();
      return;
    }

    const status = c.get("businessStatus");
    if (status !== BusinessStatuses.Active) {
      throw new BusinessInactiveError(status ?? undefined);
    }

    await next();
  });
}

export function requireBusinessOwner() {
  return createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    await loadBusinessAuthContext(c);

    const userRoles = c.get("roles") ?? [];
    if (isSuperAdmin(userRoles)) {
      await next();
      return;
    }

    if (c.get("membershipRole") !== "owner") {
      throw new AuthorizationError("Business owner membership is required.");
    }

    await next();
  });
}

export {
  permissionsForMembershipRole,
  canManageMembershipTarget,
  MANAGER_PERMISSIONS,
  OWNER_PERMISSIONS,
  STAFF_READ_PERMISSIONS,
  CATALOG_READ_PERMISSIONS,
  CATALOG_WRITE_PERMISSIONS,
  INVOICE_STAFF_PERMISSIONS,
  INVOICE_MANAGER_PERMISSIONS,
  REVIEW_STAFF_PERMISSIONS,
  REVIEW_MANAGER_PERMISSIONS,
  DISPUTE_STAFF_PERMISSIONS,
  DISPUTE_MANAGER_PERMISSIONS,
  RECORD_CASH_PERMISSIONS,
};
