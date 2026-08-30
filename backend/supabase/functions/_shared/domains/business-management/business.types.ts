export type MembershipRole =
  | "owner"
  | "manager"
  | "service_advisor"
  | "mechanic"
  | "cashier"
  | "receptionist"
  | "staff";

export type MembershipStatus = "invited" | "active" | "suspended" | "removed";

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type BusinessRecord = {
  id: string;
  slug: string;
  businessCategoryId: string;
  legalName: string;
  displayName: string;
  description: string | null;
  commercialRegistrationNumber: string | null;
  phone: string;
  email: string;
  website: string | null;
  status: string;
  verificationStatus: string;
  sourceApplicationId: string | null;
  logoPath: string | null;
  coverPath: string | null;
  averageRating: number;
  ratingCount: number;
  approvedAt: string | null;
  approvedBy: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
  closedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BusinessSettingsRecord = {
  id: string;
  businessId: string;
  appointmentsEnabled: boolean;
  productsEnabled: boolean;
  quotationsEnabled: boolean;
  invoicesEnabled: boolean;
  cashPaymentsEnabled: boolean;
  onlinePaymentsEnabled: boolean;
  reviewsEnabled: boolean;
  autoConfirmAppointments: boolean;
  defaultAppointmentDurationMinutes: number | null;
  minimumBookingNoticeMinutes: number | null;
  maximumBookingDaysAhead: number | null;
  cancellationNoticeMinutes: number | null;
  currency: string;
  locale: string;
  timezone: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BusinessMembershipRecord = {
  id: string;
  businessId: string;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  invitedBy: string | null;
  invitedAt: string;
  acceptedAt: string | null;
  suspendedAt: string | null;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessBranchRecord = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  addressLine: string;
  area: string | null;
  city: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessInvitationRecord = {
  id: string;
  businessId: string;
  email: string;
  membershipRole: MembershipRole;
  tokenHash: string;
  status: InvitationStatus;
  invitedBy: string;
  expiresAt: string;
  acceptedBy: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OpeningHoursRecord = {
  id: string;
  businessId: string;
  branchId: string | null;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClosureDateRecord = {
  id: string;
  businessId: string;
  branchId: string | null;
  closureDate: string;
  reason: string | null;
  isFullDay: boolean;
  opensAt: string | null;
  closesAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateBusinessPersistenceInput = {
  displayName?: string;
  description?: string | null;
  phone?: string;
  email?: string;
  website?: string | null;
  logoPath?: string | null;
  coverPath?: string | null;
};

export type UpdateBusinessSettingsPersistenceInput = {
  appointmentsEnabled?: boolean;
  productsEnabled?: boolean;
  quotationsEnabled?: boolean;
  invoicesEnabled?: boolean;
  cashPaymentsEnabled?: boolean;
  onlinePaymentsEnabled?: boolean;
  reviewsEnabled?: boolean;
  autoConfirmAppointments?: boolean;
  defaultAppointmentDurationMinutes?: number | null;
  minimumBookingNoticeMinutes?: number | null;
  maximumBookingDaysAhead?: number | null;
  cancellationNoticeMinutes?: number | null;
  currency?: string;
  locale?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
};

export type CreateBranchPersistenceInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  addressLine: string;
  area?: string | null;
  city?: string | null;
  countryCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  isPrimary?: boolean;
};

export type UpdateBranchPersistenceInput = {
  name?: string;
  phone?: string | null;
  email?: string | null;
  addressLine?: string;
  area?: string | null;
  city?: string | null;
  countryCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
};

export type OpeningHoursUpsertInput = {
  branchId?: string | null;
  dayOfWeek: number;
  opensAt?: string | null;
  closesAt?: string | null;
  isClosed: boolean;
};

export type CreateClosureDatePersistenceInput = {
  branchId?: string | null;
  closureDate: string;
  reason?: string | null;
  isFullDay: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
  createdBy: string;
};

export type UpdateClosureDatePersistenceInput = {
  branchId?: string | null;
  closureDate?: string;
  reason?: string | null;
  isFullDay?: boolean;
  opensAt?: string | null;
  closesAt?: string | null;
};

export type CreateInvitationPersistenceInput = {
  businessId: string;
  email: string;
  membershipRole: MembershipRole;
  tokenHash: string;
  invitedBy: string;
  expiresAt: string;
};

export type NotificationInsertInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};
