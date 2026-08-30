import type { InventoryAdjustmentType } from "../../core/constants/statuses.ts";

export type InventoryResponseDto = {
  id: string;
  productId: string;
  branchId: string;
  quantityOnHand: number;
  quantityReserved: number;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
};

export type AdjustInventoryRequestDto = {
  branchId: string;
  adjustmentType: InventoryAdjustmentType;
  quantityDelta: number;
  reason?: string | null;
};

export type AdjustInventoryResponseDto = {
  inventoryId: string;
  adjustmentId: string;
  previousQuantity: number;
  newQuantity: number;
};
