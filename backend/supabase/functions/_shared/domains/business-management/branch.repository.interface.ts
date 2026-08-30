import type {
  BusinessBranchRecord,
  CreateBranchPersistenceInput,
  UpdateBranchPersistenceInput,
} from "./business.types.ts";

export interface BranchRepository {
  listByBusiness(businessId: string, activeOnly?: boolean): Promise<BusinessBranchRecord[]>;
  findById(businessId: string, branchId: string): Promise<BusinessBranchRecord | null>;
  create(businessId: string, input: CreateBranchPersistenceInput): Promise<BusinessBranchRecord>;
  update(
    businessId: string,
    branchId: string,
    input: UpdateBranchPersistenceInput,
  ): Promise<BusinessBranchRecord>;
  makePrimaryViaRpc(
    businessId: string,
    branchId: string,
    actorUserId: string,
  ): Promise<{ branchId: string; previousPrimaryBranchId: string | null }>;
  deactivateViaRpc(
    businessId: string,
    branchId: string,
    actorUserId: string,
  ): Promise<{ branchId: string; idempotent: boolean }>;
}
