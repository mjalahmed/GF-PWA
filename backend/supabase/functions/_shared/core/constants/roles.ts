export const Roles = {
  Customer: "customer",
  BusinessOwner: "business_owner",
  BusinessManager: "business_manager",
  BusinessStaff: "business_staff",
  OnboardingOfficer: "onboarding_officer",
  SupportAgent: "support_agent",
  FinanceOperator: "finance_operator",
  ContentModerator: "content_moderator",
  DisputeOfficer: "dispute_officer",
  Admin: "admin",
  SuperAdmin: "super_admin",
  Auditor: "auditor",
} as const;

export type RoleCode = (typeof Roles)[keyof typeof Roles];

export const ROLE_CODES: RoleCode[] = Object.values(Roles);

export function assertUniqueRoleValues(roles = Roles): void {
  const values = Object.values(roles);
  const unique = new Set(values);
  if (unique.size !== values.length) {
    throw new Error("Duplicate role registry values detected.");
  }
}
