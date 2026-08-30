import type {
  BusinessApplicationStatus,
} from "../../core/constants/statuses.ts";

export const BusinessApplicationStepCodes = [
  "business_information",
  "contact_information",
  "branch_information",
  "documents",
  "review_and_submit",
] as const;

export type BusinessApplicationStepCode =
  (typeof BusinessApplicationStepCodes)[number];

export type BusinessApplicationStepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "requires_changes";

export type BusinessApplicationDocumentStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired";

export type BusinessApplicationRecord = {
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
  status: BusinessApplicationStatus | string;
  currentStep: BusinessApplicationStepCode | string;
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
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BusinessApplicationBranchRecord = {
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

export type BusinessApplicationStepRecord = {
  id: string;
  applicationId: string;
  stepCode: BusinessApplicationStepCode | string;
  status: BusinessApplicationStepStatus | string;
  data: Record<string, unknown>;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessApplicationDocumentRecord = {
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
  status: BusinessApplicationDocumentStatus | string;
  rejectionReason: string | null;
  uploadedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BusinessApplicationReviewRecord = {
  id: string;
  applicationId: string;
  reviewerUserId: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type BusinessCategoryRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessDocumentRequirementRecord = {
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateApplicationPersistenceInput = {
  applicantUserId: string;
  businessCategoryId: string;
  legalName: string;
  displayName: string;
  description?: string | null;
  commercialRegistrationNumber?: string | null;
  phone: string;
  email: string;
  website?: string | null;
};

export type UpdateApplicationPersistenceInput = {
  businessCategoryId?: string;
  legalName?: string;
  displayName?: string;
  description?: string | null;
  commercialRegistrationNumber?: string | null;
  phone?: string;
  email?: string;
  website?: string | null;
  currentStep?: BusinessApplicationStepCode | string;
};

export type UpdateBranchPersistenceInput = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  area?: string | null;
  city?: string | null;
  countryCode?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
};

export type ApplicationStatusAdminPatch = {
  status: BusinessApplicationStatus | string;
  submittedAt?: string | null;
  reviewStartedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  withdrawnAt?: string | null;
  changesRequestedAt?: string | null;
  rejectionReason?: string | null;
  changesRequestedReason?: string | null;
  assignedReviewerId?: string | null;
  createdBusinessId?: string | null;
};

export type CreateDocumentPersistenceInput = {
  id?: string;
  applicationId: string;
  documentRequirementId: string;
  documentType: string;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  documentNumber?: string | null;
  expiresAt?: string | null;
  uploadedBy: string;
};

export type ReviewDocumentPersistenceInput = {
  status: "approved" | "rejected";
  rejectionReason?: string | null;
  reviewedBy: string;
  reviewedAt: string;
};

export type CreateReviewPersistenceInput = {
  applicationId: string;
  reviewerUserId: string;
  action: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

export type ListApplicationsFilter = {
  status?: string;
  assignedReviewerId?: string;
  page?: number;
  pageSize?: number;
};

export type ApproveApplicationResult = {
  success: boolean;
  businessId: string;
  slug?: string;
  idempotent: boolean;
};

export const BUSINESS_APPLICATION_DOCUMENTS_BUCKET =
  "business-application-documents";
