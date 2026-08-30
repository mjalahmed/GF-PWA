import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import { mapCatalogRpcError } from "./catalog.errors.ts";
import type { InventoryRepository } from "./inventory.repository.interface.ts";
import type {
  AdjustInventoryInput,
  AdjustInventoryResult,
  InventoryRecord,
} from "./inventory.types.ts";

type InventoryRow = {
  id: string;
  product_id: string;
  branch_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  reorder_level: number;
  created_at: string;
  updated_at: string;
};

const INVENTORY_SELECT =
  "id, product_id, branch_id, quantity_on_hand, quantity_reserved, reorder_level, created_at, updated_at";

function toInventory(row: InventoryRow): InventoryRecord {
  return {
    id: row.id,
    productId: row.product_id,
    branchId: row.branch_id,
    quantityOnHand: row.quantity_on_hand,
    quantityReserved: row.quantity_reserved,
    reorderLevel: row.reorder_level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseInventoryRepository implements InventoryRepository {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async listByBusiness(
    businessId: string,
    filters?: { branchId?: string; productId?: string },
  ): Promise<InventoryRecord[]> {
    let query = this.readClient
      .from("product_inventory")
      .select(`${INVENTORY_SELECT}, products!inner(business_id)`)
      .eq("products.business_id", businessId);

    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.productId) query = query.eq("product_id", filters.productId);

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list inventory.", error);
    return ((data ?? []) as InventoryRow[]).map(toInventory);
  }

  async listByProduct(
    businessId: string,
    productId: string,
  ): Promise<InventoryRecord[]> {
    return this.listByBusiness(businessId, { productId });
  }

  async adjustViaRpc(
    productId: string,
    input: AdjustInventoryInput,
    actorUserId: string,
    requestId?: string,
  ): Promise<AdjustInventoryResult> {
    const { data, error } = await this.adminClient.rpc(
      "adjust_product_inventory",
      {
        p_product_id: productId,
        p_branch_id: input.branchId,
        p_adjustment_type: input.adjustmentType,
        p_quantity_delta: input.quantityDelta,
        p_actor_user_id: actorUserId,
        p_reason: input.reason ?? null,
        p_request_id: requestId ?? null,
      },
    );

    if (error) mapCatalogRpcError(error.message ?? "Inventory adjustment failed.");

    const result = data as {
      inventoryId: string;
      adjustmentId: string;
      previousQuantity: number;
      newQuantity: number;
    };

    return {
      inventoryId: result.inventoryId,
      adjustmentId: result.adjustmentId,
      previousQuantity: result.previousQuantity,
      newQuantity: result.newQuantity,
    };
  }
}
