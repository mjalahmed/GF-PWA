export type BusinessResponseDto = {
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
  suspendedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessPublicResponseDto = {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  logoPath: string | null;
  coverPath: string | null;
  phone: string;
  website: string | null;
  businessCategoryId: string;
  verificationStatus: string;
  averageRating: number;
  ratingCount: number;
  branches: BusinessPublicBranchDto[];
  openingHours: BusinessPublicOpeningHoursDto[];
};

export type BusinessPublicBranchDto = {
  id: string;
  name: string;
  phone: string | null;
  addressLine: string;
  area: string | null;
  city: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  isPrimary: boolean;
};

export type BusinessPublicOpeningHoursDto = {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type BusinessSettingsResponseDto = {
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

export type MyBusinessMembershipResponseDto = {
  membershipId: string;
  businessId: string;
  role: string;
  status: string;
  business: {
    id: string;
    slug: string;
    displayName: string;
    logoPath: string | null;
    status: string;
    verificationStatus: string;
  };
};

export type {
  BusinessIdParamsDto,
  UpdateBusinessRequestDto,
  UpdateBusinessSettingsRequestDto,
  OpeningHoursQueryDto,
  ReplaceOpeningHoursRequestDto,
  ClosureDatesQueryDto,
  CreateClosureDateRequestDto,
  UpdateClosureDateRequestDto,
  ClosureParamsDto,
} from "./business.schemas.ts";
