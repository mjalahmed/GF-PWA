export type BusinessApplicationResponseDto = {
  id: string;
  applicantUserId: string;
  businessCategoryId: string;
  legalName: string;
  displayName: string;
  description: string | null;
  commercialRegistrationNumber: string | null;
  phone: string;
  email: string;
  website: string | null;
  status: string;
  currentStep: string;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  withdrawnAt: string | null;
  changesRequestedAt: string | null;
  rejectionReason: string | null;
  changesRequestedReason: string | null;
  assignedReviewerId: string | null;
  createdBusinessId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessApplicationBranchResponseDto = {
  id: string;
  applicationId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  area: string | null;
  city: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessApplicationStepResponseDto = {
  id: string;
  applicationId: string;
  stepCode: string;
  status: string;
  data: Record<string, unknown>;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessApplicationDocumentResponseDto = {
  id: string;
  applicationId: string;
  documentRequirementId: string;
  documentType: string;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  documentNumber: string | null;
  expiresAt: string | null;
  status: string;
  rejectionReason: string | null;
  uploadedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessApplicationReviewResponseDto = {
  id: string;
  applicationId: string;
  reviewerUserId: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: string;
};

export type BusinessCategoryResponseDto = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type BusinessDocumentRequirementResponseDto = {
  id: string;
  businessCategoryId: string;
  documentType: string;
  displayName: string;
  description: string | null;
  isRequired: boolean;
  requiresExpiryDate: boolean;
  allowedMimeTypes: string[];
  maximumFileSizeBytes: number;
  sortOrder: number;
};

export type BusinessApplicationDetailResponseDto = {
  application: BusinessApplicationResponseDto;
  branch: BusinessApplicationBranchResponseDto | null;
  steps: BusinessApplicationStepResponseDto[];
  documents: BusinessApplicationDocumentResponseDto[];
  requirements: BusinessDocumentRequirementResponseDto[];
  reviews: BusinessApplicationReviewResponseDto[];
};

export type CreateDocumentMetadataResponseDto = {
  document: BusinessApplicationDocumentResponseDto;
  storagePath: string;
  bucket: string;
};

export type ApproveApplicationResponseDto = {
  businessId: string;
  slug?: string;
  idempotent: boolean;
};

export type {
  CreateApplicationRequestDto,
  UpdateApplicationRequestDto,
  UpdateBranchRequestDto,
  AssignReviewerRequestDto,
  RequestChangesRequestDto,
  RejectApplicationRequestDto,
  CreateDocumentRequestDto,
  ReviewDocumentRequestDto,
  ListApplicationsQueryDto,
  ApplicationIdParamsDto,
  ApplicationDocumentParamsDto,
  CategoryIdParamsDto,
} from "./business-application.schemas.ts";
