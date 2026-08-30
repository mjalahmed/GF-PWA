import type {
  CompatibilityType,
  ProductStockStatus,
} from "../../core/constants/statuses.ts";

export type ProductRecord = {
  id: string;
  businessId: string;
  branchId: string | null;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  brand: string | null;
  price: number;
  salePrice: number | null;
  stockStatus: ProductStockStatus;
  warrantyDescription: string | null;
  installationAvailable: boolean;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProductImageRecord = {
  id: string;
  productId: string;
  storagePath: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
};

export type ProductCompatibilityRecord = {
  id: string;
  compatibilityType: CompatibilityType;
  makeId: string | null;
  modelId: string | null;
  minimumYear: number | null;
  maximumYear: number | null;
  createdAt: string;
};

export type CreateProductPersistenceInput = {
  branchId?: string | null;
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  sku?: string | null;
  brand?: string | null;
  price: number;
  salePrice?: number | null;
  stockStatus?: ProductStockStatus;
  warrantyDescription?: string | null;
  installationAvailable?: boolean;
  metadata?: Record<string, unknown>;
};

export type UpdateProductPersistenceInput = Partial<
  Omit<CreateProductPersistenceInput, "slug">
> & { slug?: string };

export type CreateProductImagePersistenceInput = {
  id: string;
  productId: string;
  storagePath: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type ReplaceProductCompatibilityInput = {
  compatibilityType: CompatibilityType;
  makeId?: string | null;
  modelId?: string | null;
  minimumYear?: number | null;
  maximumYear?: number | null;
};

export const PRODUCT_IMAGES_BUCKET = "product-images";
