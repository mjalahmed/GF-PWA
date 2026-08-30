import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import type { ProductRepository } from "./product.repository.interface.ts";
import type {
  CreateProductImagePersistenceInput,
  CreateProductPersistenceInput,
  ProductCompatibilityRecord,
  ProductImageRecord,
  ProductRecord,
  ReplaceProductCompatibilityInput,
  UpdateProductPersistenceInput,
} from "./product.types.ts";
import type { CompatibilityType, ProductStockStatus } from "../../core/constants/statuses.ts";

type ProductRow = {
  id: string;
  business_id: string;
  branch_id: string | null;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  brand: string | null;
  price: number;
  sale_price: number | null;
  stock_status: ProductStockStatus;
  warranty_description: string | null;
  installation_available: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ProductImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

type CompatibilityRow = {
  id: string;
  product_id: string;
  compatibility_type: CompatibilityType;
  make_id: string | null;
  model_id: string | null;
  minimum_year: number | null;
  maximum_year: number | null;
  created_at: string;
};

const PRODUCT_SELECT =
  "id, business_id, branch_id, category_id, name, slug, description, sku, brand, price, sale_price, stock_status, warranty_description, installation_available, is_active, metadata, created_at, updated_at";

function toProduct(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sku: row.sku,
    brand: row.brand,
    price: row.price,
    salePrice: row.sale_price,
    stockStatus: row.stock_status,
    warrantyDescription: row.warranty_description,
    installationAvailable: row.installation_available,
    isActive: row.is_active,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toImage(row: ProductImageRow): ProductImageRecord {
  return {
    id: row.id,
    productId: row.product_id,
    storagePath: row.storage_path,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
  };
}

function toCompatibility(row: CompatibilityRow): ProductCompatibilityRecord {
  return {
    id: row.id,
    compatibilityType: row.compatibility_type,
    makeId: row.make_id,
    modelId: row.model_id,
    minimumYear: row.minimum_year,
    maximumYear: row.maximum_year,
    createdAt: row.created_at,
  };
}

function mapSupabaseError(error: { code?: string; message?: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "A conflicting product record already exists.",
      error,
    );
  }
  if (error.code === "23514") {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "Product data violates pricing constraints.",
      error,
    );
  }
  throw new InternalError("Database operation failed.", error);
}

export class SupabaseProductRepository implements ProductRepository {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async listByBusiness(
    businessId: string,
    filters?: { activeOnly?: boolean; branchId?: string; categoryId?: string },
  ): Promise<ProductRecord[]> {
    let query = this.readClient
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (filters?.activeOnly) query = query.eq("is_active", true);
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list products.", error);
    return ((data ?? []) as ProductRow[]).map(toProduct);
  }

  async findById(
    businessId: string,
    productId: string,
  ): Promise<ProductRecord | null> {
    const { data, error } = await this.readClient
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("business_id", businessId)
      .eq("id", productId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load product.", error);
    if (!data) return null;
    return toProduct(data as ProductRow);
  }

  async create(
    businessId: string,
    input: CreateProductPersistenceInput,
  ): Promise<ProductRecord> {
    const { data, error } = await this.adminClient
      .from("products")
      .insert({
        business_id: businessId,
        branch_id: input.branchId ?? null,
        category_id: input.categoryId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        sku: input.sku ?? null,
        brand: input.brand ?? null,
        price: input.price,
        sale_price: input.salePrice ?? null,
        stock_status: input.stockStatus ?? "in_stock",
        warranty_description: input.warrantyDescription ?? null,
        installation_available: input.installationAvailable ?? false,
        metadata: input.metadata ?? {},
        is_active: true,
      })
      .select(PRODUCT_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create product.");
    return toProduct(data as ProductRow);
  }

  async update(
    businessId: string,
    productId: string,
    input: UpdateProductPersistenceInput,
  ): Promise<ProductRecord> {
    const patch: Record<string, unknown> = {};
    if (input.branchId !== undefined) patch.branch_id = input.branchId;
    if (input.categoryId !== undefined) patch.category_id = input.categoryId;
    if (input.name !== undefined) patch.name = input.name;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.description !== undefined) patch.description = input.description;
    if (input.sku !== undefined) patch.sku = input.sku;
    if (input.brand !== undefined) patch.brand = input.brand;
    if (input.price !== undefined) patch.price = input.price;
    if (input.salePrice !== undefined) patch.sale_price = input.salePrice;
    if (input.stockStatus !== undefined) patch.stock_status = input.stockStatus;
    if (input.warrantyDescription !== undefined) {
      patch.warranty_description = input.warrantyDescription;
    }
    if (input.installationAvailable !== undefined) {
      patch.installation_available = input.installationAvailable;
    }
    if (input.metadata !== undefined) patch.metadata = input.metadata;

    const { data, error } = await this.adminClient
      .from("products")
      .update(patch)
      .eq("business_id", businessId)
      .eq("id", productId)
      .select(PRODUCT_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Product was not found.");
    return toProduct(data as ProductRow);
  }

  async deactivate(
    businessId: string,
    productId: string,
  ): Promise<{ idempotent: boolean }> {
    const existing = await this.findById(businessId, productId);
    if (!existing) throw new NotFoundError("Product was not found.");
    if (!existing.isActive) return { idempotent: true };

    const { error } = await this.adminClient
      .from("products")
      .update({ is_active: false })
      .eq("business_id", businessId)
      .eq("id", productId);

    if (error) mapSupabaseError(error);
    return { idempotent: false };
  }

  async listImages(productId: string): Promise<ProductImageRecord[]> {
    const { data, error } = await this.readClient
      .from("product_images")
      .select(
        "id, product_id, storage_path, alt_text, sort_order, is_primary, created_at",
      )
      .eq("product_id", productId)
      .order("sort_order");

    if (error) throw new InternalError("Failed to list product images.", error);
    return ((data ?? []) as ProductImageRow[]).map(toImage);
  }

  async createImage(
    input: CreateProductImagePersistenceInput,
  ): Promise<ProductImageRecord> {
    if (input.isPrimary) {
      await this.adminClient
        .from("product_images")
        .update({ is_primary: false })
        .eq("product_id", input.productId);
    }

    const { data, error } = await this.adminClient
      .from("product_images")
      .insert({
        id: input.id,
        product_id: input.productId,
        storage_path: input.storagePath,
        alt_text: input.altText ?? null,
        sort_order: input.sortOrder ?? 0,
        is_primary: input.isPrimary ?? false,
      })
      .select(
        "id, product_id, storage_path, alt_text, sort_order, is_primary, created_at",
      )
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create product image.");
    return toImage(data as ProductImageRow);
  }

  async deleteImage(productId: string, imageId: string): Promise<void> {
    const { data, error } = await this.adminClient
      .from("product_images")
      .delete()
      .eq("product_id", productId)
      .eq("id", imageId)
      .select("storage_path")
      .maybeSingle();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Product image was not found.");

    await this.adminClient.storage
      .from("product-images")
      .remove([(data as { storage_path: string }).storage_path]);
  }

  async listCompatibility(productId: string): Promise<ProductCompatibilityRecord[]> {
    const { data, error } = await this.readClient
      .from("product_vehicle_compatibility")
      .select(
        "id, product_id, compatibility_type, make_id, model_id, minimum_year, maximum_year, created_at",
      )
      .eq("product_id", productId)
      .order("created_at");

    if (error) {
      throw new InternalError("Failed to list product compatibility.", error);
    }
    return ((data ?? []) as CompatibilityRow[]).map(toCompatibility);
  }

  async replaceCompatibility(
    productId: string,
    items: ReplaceProductCompatibilityInput[],
  ): Promise<ProductCompatibilityRecord[]> {
    const { error: deleteError } = await this.adminClient
      .from("product_vehicle_compatibility")
      .delete()
      .eq("product_id", productId);

    if (deleteError) {
      throw new InternalError("Failed to replace compatibility.", deleteError);
    }

    if (items.length === 0) return [];

    const rows = items.map((item) => ({
      product_id: productId,
      compatibility_type: item.compatibilityType,
      make_id: item.makeId ?? null,
      model_id: item.modelId ?? null,
      minimum_year: item.minimumYear ?? null,
      maximum_year: item.maximumYear ?? null,
    }));

    const { data, error } = await this.adminClient
      .from("product_vehicle_compatibility")
      .insert(rows)
      .select(
        "id, product_id, compatibility_type, make_id, model_id, minimum_year, maximum_year, created_at",
      );

    if (error) mapSupabaseError(error);
    return ((data ?? []) as CompatibilityRow[]).map(toCompatibility);
  }
}
