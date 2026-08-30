/**
 * Canonical permission codes. Values must match database seed / RLS.
 * Naming: resource.action | resource.subresource.action
 */
export const Permissions = {
  Profile: {
    ReadOwn: "profile.read_own",
    UpdateOwn: "profile.update_own",
    ReadAll: "profile.read_all",
    Suspend: "profile.suspend",
  },
  Role: {
    Read: "role.read",
    Assign: "role.assign",
  },
  Audit: {
    /** DB seed / RLS use audit.view */
    Read: "audit.view",
  },
  User: {
    Suspend: "user.suspend",
  },
  Business: {
    Create: "business.create",
    View: "business.view",
    Read: "business.read",
    Update: "business.update",
    Approve: "business.approve",
    Reject: "business.reject",
    Suspend: "business.suspend",
    Restore: "business.restore",
    PublicRead: "business.public.read",
    Settings: {
      Read: "business.settings.read",
      Update: "business.settings.update",
    },
    Branch: {
      Read: "business.branch.read",
      Create: "business.branch.create",
      Update: "business.branch.update",
      Delete: "business.branch.delete",
    },
    Member: {
      Read: "business.member.read",
      Invite: "business.member.invite",
      Update: "business.member.update",
      Suspend: "business.member.suspend",
      Remove: "business.member.remove",
      AssignOwner: "business.member.assign_owner",
    },
    Schedule: {
      Read: "business.schedule.read",
      Update: "business.schedule.update",
    },
    Service: {
      Read: "business.service.read",
      Create: "business.service.create",
      Update: "business.service.update",
      Deactivate: "business.service.deactivate",
      ImageManage: "business.service.image.manage",
    },
    Product: {
      Read: "business.product.read",
      Create: "business.product.create",
      Update: "business.product.update",
      Deactivate: "business.product.deactivate",
      ImageManage: "business.product.image.manage",
    },
    Inventory: {
      Read: "business.inventory.read",
      Adjust: "business.inventory.adjust",
    },
  },
  Catalog: {
    CategoryRead: "catalog.category.read",
  },
  Vehicle: {
    ReadOwn: "vehicle.read_own",
    Create: "vehicle.create",
    UpdateOwn: "vehicle.update_own",
    DeactivateOwn: "vehicle.deactivate_own",
  },
  Favorite: {
    ReadOwn: "favorite.read_own",
    Create: "favorite.create",
    DeleteOwn: "favorite.delete_own",
  },
  Discovery: {
    BusinessRead: "discovery.business.read",
    CatalogRead: "discovery.catalog.read",
  },
  BusinessApplication: {
    Create: "business.application.create",
    ReadOwn: "business.application.read_own",
    UpdateOwn: "business.application.update_own",
    Submit: "business.application.submit",
    Withdraw: "business.application.withdraw",
    ReadAll: "business.application.read_all",
    AssignReviewer: "business.application.assign_reviewer",
    StartReview: "business.application.start_review",
    RequestChanges: "business.application.request_changes",
    Approve: "business.application.approve",
    Reject: "business.application.reject",
    CreateFromApplication: "business.create_from_application",
  },
  BusinessDocument: {
    Read: "business.document.read",
    Review: "business.document.review",
  },
  Appointment: {
    Read: "appointment.read",
    Create: "appointment.create",
    Confirm: "appointment.confirm",
    Reject: "appointment.reject",
    Cancel: "appointment.cancel",
    Arrive: "appointment.arrive",
    Start: "appointment.start",
    Complete: "appointment.complete",
    NoShow: "appointment.no_show",
    /** @deprecated use Read */
    View: "appointment.view",
    /** @deprecated use granular actions */
    Manage: "appointment.manage",
  },
  Quotation: {
    ReadOwn: "quotation.read_own",
    AcceptOwn: "quotation.accept_own",
    RejectOwn: "quotation.reject_own",
  },
  BusinessQuotation: {
    Read: "business.quotation.read",
    Create: "business.quotation.create",
    Update: "business.quotation.update",
    Issue: "business.quotation.issue",
    Revise: "business.quotation.revise",
    Cancel: "business.quotation.cancel",
  },
  Invoice: {
    ReadOwn: "invoice.read_own",
    ApproveOwn: "invoice.approve_own",
  },
  BusinessInvoice: {
    Read: "business.invoice.read",
    Create: "business.invoice.create",
    Update: "business.invoice.update",
    Issue: "business.invoice.issue",
    Cancel: "business.invoice.cancel",
  },
  Payment: {
    ReadOwn: "payment.read_own",
  },
  BusinessPayment: {
    Read: "business.payment.read",
    RecordCash: "business.payment.record_cash",
    /** Reserved — not granted in Phase 8 */
    Refund: "business.payment.refund",
    /** Reserved — not granted in Phase 8 */
    OnlineInitiate: "business.payment.online_initiate",
  },
  Review: {
    EligibilityReadOwn: "review.eligibility.read_own",
    Create: "review.create",
    ReadOwn: "review.read_own",
    UpdateOwn: "review.update_own",
    Report: "review.report",
    PublicRead: "review.public.read",
    Moderate: "review.moderate",
    ReportRead: "review.report.read",
    ReportResolve: "review.report.resolve",
  },
  BusinessReview: {
    Read: "business.review.read",
    Respond: "business.review.respond",
  },
  Dispute: {
    Create: "dispute.create",
    ReadOwn: "dispute.read_own",
    MessageOwn: "dispute.message_own",
    EvidenceOwn: "dispute.evidence_own",
    ReadAll: "dispute.read_all",
    Assign: "dispute.assign",
    RequestResponse: "dispute.request_response",
    Review: "dispute.review",
    Resolve: "dispute.resolve",
    Reject: "dispute.reject",
    Close: "dispute.close",
    InternalNote: "dispute.internal_note",
  },
  BusinessDispute: {
    Read: "business.dispute.read",
    Respond: "business.dispute.respond",
    Evidence: "business.dispute.evidence",
    Create: "business.dispute.create",
  },
} as const;

type NestedValues<T> = T extends string ? T
  : T extends Record<string, infer U> ? NestedValues<U>
  : never;

export type PermissionCode = NestedValues<typeof Permissions>;

export function flattenPermissionCodes(
  tree: Record<string, unknown> = Permissions as unknown as Record<string, unknown>,
): string[] {
  const out: string[] = [];
  for (const value of Object.values(tree)) {
    if (typeof value === "string") out.push(value);
    else if (value && typeof value === "object") {
      out.push(...flattenPermissionCodes(value as Record<string, unknown>));
    }
  }
  return out;
}

export const PERMISSION_CODES: PermissionCode[] = flattenPermissionCodes() as PermissionCode[];

export function assertUniquePermissionValues(): void {
  const values = flattenPermissionCodes();
  const unique = new Set(values);
  if (unique.size !== values.length) {
    throw new Error("Duplicate permission registry values detected.");
  }
}
