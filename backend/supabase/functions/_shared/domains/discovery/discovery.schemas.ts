import { z } from "npm:zod@3.24.1";
import { paginationQuerySchema } from "../../core/validation/common.schemas.ts";

export const discoverySearchQuerySchema = paginationQuerySchema.extend({
  query: z.string().trim().max(200).optional(),
  businessCategory: z.string().uuid().optional(),
  serviceCategory: z.string().uuid().optional(),
  productCategory: z.string().uuid().optional(),
  area: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  minimumRating: z.coerce.number().min(0).max(5).optional(),
  openNow: z.coerce.boolean().optional(),
  vehicleId: z.string().uuid().optional(),
  vehicleMakeId: z.string().uuid().optional(),
  vehicleModelId: z.string().uuid().optional(),
  vehicleYear: z.coerce.number().int().min(1950).optional(),
  hasServices: z.coerce.boolean().optional(),
  hasProducts: z.coerce.boolean().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  sort: z.enum(["relevance", "rating", "newest", "distance", "name"]).default(
    "relevance",
  ).optional(),
}).strict();

export const discoverySlugParamsSchema = z.object({
  slug: z.string().trim().min(2).max(200),
}).strict();

export const discoveryCatalogQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
}).strict();

export const favoriteBusinessParamsSchema = z.object({
  businessId: z.string().uuid(),
}).strict();

export type DiscoverySearchQueryDto = z.infer<typeof discoverySearchQuerySchema>;
export type DiscoverySlugParamsDto = z.infer<typeof discoverySlugParamsSchema>;
export type DiscoveryCatalogQueryDto = z.infer<typeof discoveryCatalogQuerySchema>;
export type FavoriteBusinessParamsDto = z.infer<typeof favoriteBusinessParamsSchema>;
