import type {
  CreateProductImagePersistenceInput,
  CreateProductPersistenceInput,
  ProductCompatibilityRecord,
  ProductImageRecord,
  ProductRecord,
  ReplaceProductCompatibilityInput,
  UpdateProductPersistenceInput,
} from "./product.types.ts";

export interface ProductRepository {
  listByBusiness(
    businessId: string,
    filters?: { activeOnly?: boolean; branchId?: string; categoryId?: string },
  ): Promise<ProductRecord[]>;
  findById(businessId: string, productId: string): Promise<ProductRecord | null>;
  create(businessId: string, input: CreateProductPersistenceInput): Promise<ProductRecord>;
  update(
    businessId: string,
    productId: string,
    input: UpdateProductPersistenceInput,
  ): Promise<ProductRecord>;
  deactivate(businessId: string, productId: string): Promise<{ idempotent: boolean }>;
  listImages(productId: string): Promise<ProductImageRecord[]>;
  createImage(input: CreateProductImagePersistenceInput): Promise<ProductImageRecord>;
  deleteImage(productId: string, imageId: string): Promise<void>;
  listCompatibility(productId: string): Promise<ProductCompatibilityRecord[]>;
  replaceCompatibility(
    productId: string,
    items: ReplaceProductCompatibilityInput[],
  ): Promise<ProductCompatibilityRecord[]>;
}
