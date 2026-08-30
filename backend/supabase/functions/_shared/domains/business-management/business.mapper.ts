import type {
  BusinessPublicResponseDto,
  BusinessResponseDto,
  BusinessSettingsResponseDto,
  MyBusinessMembershipResponseDto,
} from "./business.dto.ts";
import type {
  BusinessBranchRecord,
  BusinessMembershipRecord,
  BusinessRecord,
  BusinessSettingsRecord,
  OpeningHoursRecord,
} from "./business.types.ts";

export class BusinessMapper {
  static toBusinessDto(record: BusinessRecord): BusinessResponseDto {
    return {
      id: record.id,
      slug: record.slug,
      businessCategoryId: record.businessCategoryId,
      legalName: record.legalName,
      displayName: record.displayName,
      description: record.description,
      commercialRegistrationNumber: record.commercialRegistrationNumber,
      phone: record.phone,
      email: record.email,
      website: record.website,
      status: record.status,
      verificationStatus: record.verificationStatus,
      sourceApplicationId: record.sourceApplicationId,
      logoPath: record.logoPath,
      coverPath: record.coverPath,
      averageRating: record.averageRating,
      ratingCount: record.ratingCount,
      approvedAt: record.approvedAt,
      suspendedAt: record.suspendedAt,
      closedAt: record.closedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toSettingsDto(record: BusinessSettingsRecord): BusinessSettingsResponseDto {
    return {
      id: record.id,
      businessId: record.businessId,
      appointmentsEnabled: record.appointmentsEnabled,
      productsEnabled: record.productsEnabled,
      quotationsEnabled: record.quotationsEnabled,
      invoicesEnabled: record.invoicesEnabled,
      cashPaymentsEnabled: record.cashPaymentsEnabled,
      onlinePaymentsEnabled: record.onlinePaymentsEnabled,
      reviewsEnabled: record.reviewsEnabled,
      autoConfirmAppointments: record.autoConfirmAppointments,
      defaultAppointmentDurationMinutes: record.defaultAppointmentDurationMinutes,
      minimumBookingNoticeMinutes: record.minimumBookingNoticeMinutes,
      maximumBookingDaysAhead: record.maximumBookingDaysAhead,
      cancellationNoticeMinutes: record.cancellationNoticeMinutes,
      currency: record.currency,
      locale: record.locale,
      timezone: record.timezone,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toPublicDto(input: {
    business: BusinessRecord;
    branches: BusinessBranchRecord[];
    openingHours: OpeningHoursRecord[];
  }): BusinessPublicResponseDto {
    return {
      id: input.business.id,
      slug: input.business.slug,
      displayName: input.business.displayName,
      description: input.business.description,
      logoPath: input.business.logoPath,
      coverPath: input.business.coverPath,
      phone: input.business.phone,
      website: input.business.website,
      businessCategoryId: input.business.businessCategoryId,
      verificationStatus: input.business.verificationStatus,
      averageRating: input.business.averageRating,
      ratingCount: input.business.ratingCount,
      branches: input.branches
        .filter((b) => b.isActive)
        .map((b) => ({
          id: b.id,
          name: b.name,
          phone: b.phone,
          addressLine: b.addressLine,
          area: b.area,
          city: b.city,
          countryCode: b.countryCode,
          latitude: b.latitude,
          longitude: b.longitude,
          timezone: b.timezone,
          isPrimary: b.isPrimary,
        })),
      openingHours: input.openingHours
        .filter((h) => h.branchId == null)
        .map((h) => ({
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.isClosed,
        })),
    };
  }

  static toMyMembershipDto(input: {
    membership: BusinessMembershipRecord;
    business: BusinessRecord;
  }): MyBusinessMembershipResponseDto {
    return {
      membershipId: input.membership.id,
      businessId: input.membership.businessId,
      role: input.membership.role,
      status: input.membership.status,
      business: {
        id: input.business.id,
        slug: input.business.slug,
        displayName: input.business.displayName,
        logoPath: input.business.logoPath,
        status: input.business.status,
        verificationStatus: input.business.verificationStatus,
      },
    };
  }
}
