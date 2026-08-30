import type {
  CompatibilityType,
  ProductStockStatus,
} from "../../core/constants/statuses.ts";

export type ProductImageResponseDto = {
  id: string;
  productId: string;
  storagePath: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
};

export type ProductCompatibilityResponseDto = {
  id: string;
  compatibilityType: CompatibilityType;
  makeId: string | null;
  modelId: string | null;
  minimumYear: number | null;
  maximumYear: number | null;
  createdAt: string;
};

export type ProductResponseDto = {
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
  images?: ProductImageResponseDto[];
  compatibility?: ProductCompatibilityResponseDto[];
};

export type CreateProductRequestDto = {
  branchId?: string | null;
  categoryId: string;
  name: string;
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

export type UpdateProductRequestDto = Partial<CreateProductRequestDto>;

export type CreateProductImageRequestDto = {
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type CreateProductImageMetadataResponseDto = {
  image: ProductImageResponseDto;
  storagePath: string;
  bucket: string;
};

export type ReplaceProductCompatibilityRequestDto = {
  items: Array<{
    compatibilityType: CompatibilityType;
    makeId?: string | null;
    modelId?: string | null;
    minimumYear?: number | null;
    maximumYear?: number | null;
  }>;
};

export type DeactivateProductResponseDto = {
  productId: string;
  idempotent: boolean;
};
