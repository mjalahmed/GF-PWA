import type {
  AdminReviewDto,
  BusinessReviewDto,
  CustomerReviewDto,
  PublicReviewDto,
  ReviewEligibilityDto,
  ReviewRatingDto,
  ReviewReportDto,
  ReviewResponseDto,
} from "./review.dto.ts";
import type {
  ReviewEligibilityRecord,
  ReviewRecord,
  ReviewReportRecord,
} from "./review.types.ts";

export type ReviewAudience = "public" | "customer" | "business" | "admin";

export function formatReviewerDisplayName(
  fullName: string | null | undefined,
): string {
  if (!fullName?.trim()) return "Verified Customer";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const lastInitial = parts[parts.length - 1]![0]?.toUpperCase();
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

export class ReviewMapper {
  static toRatingDto(record: { dimension: string; rating: number }): ReviewRatingDto {
    return {
      dimension: record.dimension as ReviewRatingDto["dimension"],
      rating: record.rating,
    };
  }

  static toResponseDto(
    record: NonNullable<ReviewRecord["response"]>,
  ): ReviewResponseDto {
    return {
      id: record.id,
      response: record.response,
      respondedBy: record.respondedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toEligibilityDto(record: ReviewEligibilityRecord): ReviewEligibilityDto {
    return {
      id: record.id,
      businessId: record.businessId,
      appointmentId: record.appointmentId,
      invoiceId: record.invoiceId,
      verificationType: record.verificationType,
      isUsed: record.isUsed,
      usedAt: record.usedAt,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    };
  }

  static toPublicDto(record: ReviewRecord): PublicReviewDto {
    const dto: PublicReviewDto = {
      id: record.id,
      businessId: record.businessId,
      overallRating: record.overallRating,
      comment: record.comment,
      ratings: record.ratings.map(ReviewMapper.toRatingDto),
      verified: true,
      verificationType: record.verificationType,
      reviewerDisplayName: formatReviewerDisplayName(record.reviewerFullName),
      publishedAt: record.publishedAt,
      editedAt: record.editedAt,
      createdAt: record.createdAt,
    };

    if (record.response) {
      dto.response = ReviewMapper.toResponseDto(record.response);
    }

    return dto;
  }

  static toCustomerDto(
    record: ReviewRecord,
    context?: { appointmentId?: string | null; invoiceId?: string | null },
  ): CustomerReviewDto {
    return {
      ...ReviewMapper.toPublicDto(record),
      eligibilityId: record.eligibilityId,
      customerId: record.customerId,
      status: record.status,
      appointmentId: context?.appointmentId ?? null,
      invoiceId: context?.invoiceId ?? null,
    };
  }

  static toBusinessDto(
    record: ReviewRecord,
    context?: { appointmentId?: string | null; invoiceId?: string | null },
  ): BusinessReviewDto {
    return ReviewMapper.toCustomerDto(record, context);
  }

  static toAdminDto(
    record: ReviewRecord,
    context?: { appointmentId?: string | null; invoiceId?: string | null },
  ): AdminReviewDto {
    return ReviewMapper.toBusinessDto(record, context);
  }

  static toAudienceDto(
    record: ReviewRecord,
    audience: ReviewAudience,
    context?: { appointmentId?: string | null; invoiceId?: string | null },
  ): PublicReviewDto | CustomerReviewDto | BusinessReviewDto | AdminReviewDto {
    switch (audience) {
      case "public":
        return ReviewMapper.toPublicDto(record);
      case "customer":
        return ReviewMapper.toCustomerDto(record, context);
      case "business":
        return ReviewMapper.toBusinessDto(record, context);
      case "admin":
        return ReviewMapper.toAdminDto(record, context);
    }
  }

  static toReportDto(record: ReviewReportRecord): ReviewReportDto {
    return {
      id: record.id,
      reviewId: record.reviewId,
      reportedBy: record.reportedBy,
      reasonCode: record.reasonCode,
      details: record.details,
      status: record.status,
      createdAt: record.createdAt,
      resolvedAt: record.resolvedAt,
      resolvedBy: record.resolvedBy,
    };
  }
}
