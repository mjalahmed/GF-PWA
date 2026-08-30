import type { InventoryResponseDto } from "./inventory.dto.ts";
import type { InventoryRecord } from "./inventory.types.ts";

export class InventoryMapper {
  static toDto(record: InventoryRecord): InventoryResponseDto {
    return {
      id: record.id,
      productId: record.productId,
      branchId: record.branchId,
      quantityOnHand: record.quantityOnHand,
      quantityReserved: record.quantityReserved,
      reorderLevel: record.reorderLevel,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
