import { z } from "npm:zod@3.24.1";
import { businessIdParamsSchema } from "../business-management/business.schemas.ts";
import { CompatibilityTypes } from "../../core/constants/statuses.ts";
import { servicePricingTypeSchema } from "./catalog.validation.ts";

const uuidSchema = z.string().uuid();

export const serviceParamsSchema = z.object({
  businessId: uuidSchema,
  serviceId: uuidSchema,
}).strict();

export const serviceImageParamsSchema = z.object({
  businessId: uuidSchema,
  serviceId: uuidSchema,
  imageId: uuidSchema,
}).strict();

export const listServicesQuerySchema = z.object({
  activeOnly: z.coerce.boolean().optional(),
  branchId: uuidSchema.optional(),
  categoryId: uuidSchema.optional(),
}).strict();

export const createServiceSchema = z.object({
  branchId: uuidSchema.nullable().optional(),
  categoryId: uuidSchema,
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  pricingType: servicePricingTypeSchema,
  price: z.number().min(0).nullable().optional(),
  minimumPrice: z.number().min(0).nullable().optional(),
  maximumPrice: z.number().min(0).nullable().optional(),
  estimatedDurationMinutes: z.number().int().min(0).nullable().optional(),
  requiresAppointment: z.boolean().optional(),
  requiresVehicle: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export const updateServiceSchema = createServiceSchema.partial().strict();

export const createServiceImageSchema = z.object({
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

export const replaceServiceCompatibilitySchema = z.object({
  items: z.array(compatibilityItemSchema).max(100),
}).strict();

export type ServiceParamsDto = z.infer<typeof serviceParamsSchema>;
export type ServiceImageParamsDto = z.infer<typeof serviceImageParamsSchema>;
export type ListServicesQueryDto = z.infer<typeof listServicesQuerySchema>;
export type CreateServiceRequestDto = z.infer<typeof createServiceSchema>;
export type UpdateServiceRequestDto = z.infer<typeof updateServiceSchema>;
export type CreateServiceImageRequestDto = z.infer<typeof createServiceImageSchema>;
export type ReplaceServiceCompatibilityRequestDto = z.infer<
  typeof replaceServiceCompatibilitySchema
>;

export { businessIdParamsSchema };
