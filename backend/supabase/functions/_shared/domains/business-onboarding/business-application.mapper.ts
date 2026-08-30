import type {
  BusinessApplicationBranchRecord,
  BusinessApplicationDocumentRecord,
  BusinessApplicationRecord,
  BusinessApplicationReviewRecord,
  BusinessApplicationStepRecord,
  BusinessCategoryRecord,
  BusinessDocumentRequirementRecord,
} from "./business-application.types.ts";
import type {
  BusinessApplicationBranchResponseDto,
  BusinessApplicationDetailResponseDto,
  BusinessApplicationDocumentResponseDto,
  BusinessApplicationResponseDto,
  BusinessApplicationReviewResponseDto,
  BusinessApplicationStepResponseDto,
  BusinessCategoryResponseDto,
  BusinessDocumentRequirementResponseDto,
} from "./business-application.dto.ts";

export const BusinessApplicationMapper = {
  toApplicationDto(
    record: BusinessApplicationRecord,
  ): BusinessApplicationResponseDto {
    return {
      id: record.id,
      applicantUserId: record.applicantUserId,
      businessCategoryId: record.businessCategoryId,
      legalName: record.legalName,
      displayName: record.displayName,
      description: record.description,
      commercialRegistrationNumber: record.commercialRegistrationNumber,
      phone: record.phone,
      email: record.email,
      website: record.website,
      status: record.status,
      currentStep: record.currentStep,
      submittedAt: record.submittedAt,
      reviewStartedAt: record.reviewStartedAt,
      approvedAt: record.approvedAt,
      rejectedAt: record.rejectedAt,
      withdrawnAt: record.withdrawnAt,
      changesRequestedAt: record.changesRequestedAt,
      rejectionReason: record.rejectionReason,
      changesRequestedReason: record.changesRequestedReason,
      assignedReviewerId: record.assignedReviewerId,
      createdBusinessId: record.createdBusinessId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },

  toBranchDto(
    record: BusinessApplicationBranchRecord,
  ): BusinessApplicationBranchResponseDto {
    return {
      id: record.id,
      applicationId: record.applicationId,
      name: record.name,
      phone: record.phone,
      email: record.email,
      addressLine: record.addressLine,
      area: record.area,
      city: record.city,
      countryCode: record.countryCode,
      latitude: record.latitude,
      longitude: record.longitude,
      timezone: record.timezone,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },

  toStepDto(
    record: BusinessApplicationStepRecord,
  ): BusinessApplicationStepResponseDto {
    return {
      id: record.id,
      applicationId: record.applicationId,
      stepCode: record.stepCode,
      status: record.status,
      data: record.data,
      completedAt: record.completedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },

  toDocumentDto(
    record: BusinessApplicationDocumentRecord,
  ): BusinessApplicationDocumentResponseDto {
    return {
      id: record.id,
      applicationId: record.applicationId,
      documentRequirementId: record.documentRequirementId,
      documentType: record.documentType,
      storagePath: record.storagePath,
      originalFileName: record.originalFileName,
      mimeType: record.mimeType,
      fileSizeBytes: record.fileSizeBytes,
      documentNumber: record.documentNumber,
      expiresAt: record.expiresAt,
      status: record.status,
      rejectionReason: record.rejectionReason,
      uploadedBy: record.uploadedBy,
      reviewedBy: record.reviewedBy,
      reviewedAt: record.reviewedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },

  toReviewDto(
    record: BusinessApplicationReviewRecord,
  ): BusinessApplicationReviewResponseDto {
    return {
      id: record.id,
      applicationId: record.applicationId,
      reviewerUserId: record.reviewerUserId,
      action: record.action,
      previousStatus: record.previousStatus,
      newStatus: record.newStatus,
      reason: record.reason,
      notes: record.notes,
      createdAt: record.createdAt,
    };
  },

  toCategoryDto(
    record: BusinessCategoryRecord,
  ): BusinessCategoryResponseDto {
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description,
      sortOrder: record.sortOrder,
    };
  },

  toRequirementDto(
    record: BusinessDocumentRequirementRecord,
  ): BusinessDocumentRequirementResponseDto {
    return {
      id: record.id,
      businessCategoryId: record.businessCategoryId,
      documentType: record.documentType,
      displayName: record.displayName,
      description: record.description,
      isRequired: record.isRequired,
      requiresExpiryDate: record.requiresExpiryDate,
      allowedMimeTypes: record.allowedMimeTypes,
      maximumFileSizeBytes: record.maximumFileSizeBytes,
      sortOrder: record.sortOrder,
    };
  },

  toDetailDto(input: {
    application: BusinessApplicationRecord;
    branch: BusinessApplicationBranchRecord | null;
    steps: BusinessApplicationStepRecord[];
    documents: BusinessApplicationDocumentRecord[];
    requirements: BusinessDocumentRequirementRecord[];
    reviews: BusinessApplicationReviewRecord[];
  }): BusinessApplicationDetailResponseDto {
    return {
      application: BusinessApplicationMapper.toApplicationDto(input.application),
      branch: input.branch
        ? BusinessApplicationMapper.toBranchDto(input.branch)
        : null,
      steps: input.steps.map(BusinessApplicationMapper.toStepDto),
      documents: input.documents.map(BusinessApplicationMapper.toDocumentDto),
      requirements: input.requirements.map(
        BusinessApplicationMapper.toRequirementDto,
      ),
      reviews: input.reviews.map(BusinessApplicationMapper.toReviewDto),
    };
  },
};

export function buildDocumentStoragePath(
  userId: string,
  applicationId: string,
  documentId: string,
  originalFileName: string,
): string {
  const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `applications/${userId}/${applicationId}/${documentId}/${safeName}`;
}
