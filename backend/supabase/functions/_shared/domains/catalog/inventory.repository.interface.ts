import type {
  AdjustInventoryInput,
  AdjustInventoryResult,
  InventoryRecord,
} from "./inventory.types.ts";

export interface InventoryRepository {
  listByBusiness(
    businessId: string,
    filters?: { branchId?: string; productId?: string },
  ): Promise<InventoryRecord[]>;
  listByProduct(businessId: string, productId: string): Promise<InventoryRecord[]>;
  adjustViaRpc(
    productId: string,
    input: AdjustInventoryInput,
    actorUserId: string,
    requestId?: string,
  ): Promise<AdjustInventoryResult>;
}
