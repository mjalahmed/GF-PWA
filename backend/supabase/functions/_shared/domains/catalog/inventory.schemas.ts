import { z } from "npm:zod@3.24.1";
import { businessIdParamsSchema } from "../business-management/business.schemas.ts";
import { InventoryAdjustmentTypes } from "../../core/constants/statuses.ts";

const uuidSchema = z.string().uuid();

export const productParamsSchema = z.object({
  businessId: uuidSchema,
  productId: uuidSchema,
}).strict();

export const listInventoryQuerySchema = z.object({
  branchId: uuidSchema.optional(),
  productId: uuidSchema.optional(),
}).strict();

export const adjustInventorySchema = z.object({
  branchId: uuidSchema,
  adjustmentType: z.enum([
    InventoryAdjustmentTypes.ManualAdd,
    InventoryAdjustmentTypes.ManualRemove,
    InventoryAdjustmentTypes.Correction,
  ]),
  quantityDelta: z.number().int().refine((v) => v !== 0, {
    message: "quantityDelta must not be zero",
  }),
  reason: z.string().trim().max(500).nullable().optional(),
}).strict();

export type ProductParamsDto = z.infer<typeof productParamsSchema>;
export type ListInventoryQueryDto = z.infer<typeof listInventoryQuerySchema>;
export type AdjustInventoryRequestDto = z.infer<typeof adjustInventorySchema>;

export { businessIdParamsSchema };
