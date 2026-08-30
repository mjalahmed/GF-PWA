import { z } from "npm:zod@3.24.1";
import { businessIdParamsSchema } from "../business-management/business.schemas.ts";
import {
  CompatibilityTypes,
  ProductStockStatuses,
} from "../../core/constants/statuses.ts";

const uuidSchema = z.string().uuid();

export const productParamsSchema = z.object({
  businessId: uuidSchema,
  productId: uuidSchema,
}).strict();

export const productImageParamsSchema = z.object({
  businessId: uuidSchema,
  productId: uuidSchema,
  imageId: uuidSchema,
}).strict();

export const listProductsQuerySchema = z.object({
  activeOnly: z.coerce.boolean().optional(),
  branchId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
}).strict();

export const createProductSchema = z.object({
  branchId: uuidSchema.nullable().optional(),
  categoryId: uuidSchema,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  sku: z.string().trim().max(100).nullable().optional(),
  brand: z.string().trim().max(120).nullable().optional(),
  price: z.number().min(0),
  salePrice: z.number().min(0).nullable().optional(),
  stockStatus: z.enum([
    ProductStockStatuses.InStock,
    ProductStockStatuses.LowStock,
    ProductStockStatuses.OutOfStock,
    ProductStockStatuses.Preorder,
    ProductStockStatuses.Unavailable,
  ]).optional(),
  warrantyDescription: z.string().trim().max(2000).nullable().optional(),
  installationAvailable: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export const updateProductSchema = createProductSchema.partial().strict();

export const createProductImageSchema = z.object({
  originalFileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSizeBytes: z.number().int().min(1).max(5_242_880),
  altText: z.string().trim().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
}).strict();

const compatibilityItemSchema = z.object({
  compatibilityType: z.enum([
    CompatibilityTypes.AllVehicles,
    CompatibilityTypes.Make,
    CompatibilityTypes.Model,
    CompatibilityTypes.YearRange,
  ]),
  makeId: uuidSchema.nullable().optional(),
  modelId: uuidSchema.nullable().optional(),
  minimumYear: z.number().int().min(1950).nullable().optional(),
  maximumYear: z.number().int().min(1950).nullable().optional(),
}).strict();

export const replaceProductCompatibilitySchema = z.object({
  items: z.array(compatibilityItemSchema).max(100),
}).strict();

export type ProductParamsDto = z.infer<typeof productParamsSchema>;
export type ProductImageParamsDto = z.infer<typeof productImageParamsSchema>;
export type ListProductsQueryDto = z.infer<typeof listProductsQuerySchema>;
export type CreateProductRequestDto = z.infer<typeof createProductSchema>;
export type UpdateProductRequestDto = z.infer<typeof updateProductSchema>;
export type CreateProductImageRequestDto = z.infer<typeof createProductImageSchema>;
export type ReplaceProductCompatibilityRequestDto = z.infer<
  typeof replaceProductCompatibilitySchema
>;

export { businessIdParamsSchema };
