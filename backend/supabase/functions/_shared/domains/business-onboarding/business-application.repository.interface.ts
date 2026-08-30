import type {
  ApproveApplicationResult,
  BusinessApplicationBranchRecord,
  BusinessApplicationRecord,
  BusinessApplicationStepRecord,
  BusinessCategoryRecord,
  BusinessDocumentRequirementRecord,
  CreateApplicationPersistenceInput,
  ListApplicationsFilter,
  UpdateApplicationPersistenceInput,
  UpdateBranchPersistenceInput,
  ApplicationStatusAdminPatch,
} from "./business-application.types.ts";

export interface BusinessApplicationRepository {
  create(input: CreateApplicationPersistenceInput): Promise<BusinessApplicationRecord>;
  findById(id: string): Promise<BusinessApplicationRecord | null>;
  findByApplicant(userId: string): Promise<BusinessApplicationRecord[]>;
  findAll(
    filters: ListApplicationsFilter,
  ): Promise<{ items: BusinessApplicationRecord[]; total: number }>;
  updateFields(
    id: string,
    input: UpdateApplicationPersistenceInput,
  ): Promise<BusinessApplicationRecord>;
  updateStatusAdmin(
    id: string,
    patch: ApplicationStatusAdminPatch,
  ): Promise<BusinessApplicationRecord>;
  findBranch(applicationId: string): Promise<BusinessApplicationBranchRecord | null>;
  upsertBranch(
    applicationId: string,
    input: UpdateBranchPersistenceInput,
  ): Promise<BusinessApplicationBranchRecord>;
  findSteps(applicationId: string): Promise<BusinessApplicationStepRecord[]>;
  approveViaRpc(
    applicationId: string,
    actorUserId: string,
    requestId?: string,
  ): Promise<ApproveApplicationResult>;
  listCategories(): Promise<BusinessCategoryRecord[]>;
  findCategoryById(id: string): Promise<BusinessCategoryRecord | null>;
  listRequirements(categoryId: string): Promise<BusinessDocumentRequirementRecord[]>;
  findRequirementById(
    id: string,
  ): Promise<BusinessDocumentRequirementRecord | null>;
}
