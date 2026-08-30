import { ValidationError } from "../../core/errors/app-error.ts";
import { slugify } from "../../core/utils/slugify.ts";
import { CompatibilityTypes, ProductStockStatuses } from "../../core/constants/statuses.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BranchRepository } from "../business-management/branch.repository.interface.ts";
import type { CategoryRepository } from "./category.repository.interface.ts";
import type { ProductRepository } from "./product.repository.interface.ts";
import {
  BranchBusinessMismatchError,
  CatalogImageNotFoundError,
  CategoryNotFoundError,
  ProductNotFoundError,
  buildCatalogImageStoragePath,
} from "./catalog.errors.ts";
import { validateProductPricing } from "./catalog.validation.ts";
import { ProductMapper } from "./product.mapper.ts";
import type {
  CreateProductImageMetadataResponseDto,
  CreateProductImageRequestDto,
  CreateProductRequestDto,
  DeactivateProductResponseDto,
  ProductCompatibilityResponseDto,
  ProductResponseDto,
  ReplaceProductCompatibilityRequestDto,
  UpdateProductRequestDto,
} from "./product.dto.ts";
import type { ReplaceProductCompatibilityInput } from "./product.types.ts";
import { PRODUCT_IMAGES_BUCKET } from "./product.types.ts";

export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly branchRepository: BranchRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  private async assertBranch(
    businessId: string,
    branchId: string | null | undefined,
  ): Promise<void> {
    if (!branchId) return;
    const branch = await this.branchRepository.findById(businessId, branchId);
    if (!branch) throw new BranchBusinessMismatchError();
  }

  private async assertProductCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findProductCategoryById(
      categoryId,
    );
    if (!category) throw new CategoryNotFoundError(categoryId);
  }

  private validateCompatibilityItems(
    items: ReplaceProductCompatibilityRequestDto["items"],
  ): ReplaceProductCompatibilityInput[] {
    return items.map((item) => {
      if (item.compatibilityType === CompatibilityTypes.AllVehicles) {
        if (item.makeId || item.modelId || item.minimumYear || item.maximumYear) {
          throw new ValidationError(
            "All-vehicles compatibility cannot include make, model, or year fields.",
          );
        }
      } else if (item.compatibilityType === CompatibilityTypes.Make) {
        if (!item.makeId || item.modelId) {
          throw new ValidationError("Make compatibility requires makeId only.");
        }
      } else if (item.compatibilityType === CompatibilityTypes.Model) {
        if (!item.makeId || !item.modelId) {
          throw new ValidationError(
            "Model compatibility requires makeId and modelId.",
          );
        }
      } else if (item.compatibilityType === CompatibilityTypes.YearRange) {
        if (
          !item.makeId || item.minimumYear == null || item.maximumYear == null
        ) {
          throw new ValidationError(
            "Year-range compatibility requires makeId, minimumYear, and maximumYear.",
          );
        }
        if (item.minimumYear > item.maximumYear) {
          throw new ValidationError("minimumYear cannot exceed maximumYear.");
        }
      }
      return {
        compatibilityType: item.compatibilityType,
        makeId: item.makeId ?? null,
        modelId: item.modelId ?? null,
        minimumYear: item.minimumYear ?? null,
        maximumYear: item.maximumYear ?? null,
      };
    });
  }

  async list(
    businessId: string,
    filters?: { activeOnly?: boolean; branchId?: string; categoryId?: string },
  ): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.listByBusiness(
      businessId,
      filters,
    );
    return products.map(ProductMapper.toDto);
  }

  async getById(
    businessId: string,
    productId: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(businessId, productId);
    if (!product) throw new ProductNotFoundError(productId);
    const [images, compatibility] = await Promise.all([
      this.productRepository.listImages(productId),
      this.productRepository.listCompatibility(productId),
    ]);
    return ProductMapper.toDetailDto({ product, images, compatibility });
  }

  async create(
    actorUserId: string,
    businessId: string,
    input: CreateProductRequestDto,
    requestId?: string,
  ): Promise<ProductResponseDto> {
    await this.assertBranch(businessId, input.branchId);
    await this.assertProductCategory(input.categoryId);
    validateProductPricing({ price: input.price, salePrice: input.salePrice });

    const product = await this.productRepository.create(businessId, {
      branchId: input.branchId ?? null,
      categoryId: input.categoryId,
      name: input.name,
      slug: slugify(input.name),
      description: input.description ?? null,
      sku: input.sku ?? null,
      brand: input.brand ?? null,
      price: input.price,
      salePrice: input.salePrice ?? null,
      stockStatus: input.stockStatus ?? ProductStockStatuses.InStock,
      warrantyDescription: input.warrantyDescription ?? null,
      installationAvailable: input.installationAvailable,
      metadata: input.metadata,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "product.created",
      entityType: "product",
      entityId: product.id,
      requestId,
      metadata: { businessId },
    });

    return ProductMapper.toDto(product);
  }

  async update(
    actorUserId: string,
    businessId: string,
    productId: string,
    input: UpdateProductRequestDto,
    requestId?: string,
  ): Promise<ProductResponseDto> {
    const existing = await this.productRepository.findById(
      businessId,
      productId,
    );
    if (!existing) throw new ProductNotFoundError(productId);

    if (input.branchId !== undefined) {
      await this.assertBranch(businessId, input.branchId);
    }
    if (input.categoryId) await this.assertProductCategory(input.categoryId);

    validateProductPricing({
      price: input.price ?? existing.price,
      salePrice: input.salePrice !== undefined
        ? input.salePrice
        : existing.salePrice,
    });

    const updated = await this.productRepository.update(businessId, productId, {
      ...input,
      slug: input.name ? slugify(input.name) : undefined,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "product.updated",
      entityType: "product",
      entityId: productId,
      requestId,
      metadata: { businessId },
    });

    return ProductMapper.toDto(updated);
  }

  async deactivate(
    actorUserId: string,
    businessId: string,
    productId: string,
    requestId?: string,
  ): Promise<DeactivateProductResponseDto> {
    const existing = await this.productRepository.findById(
      businessId,
      productId,
    );
    if (!existing) throw new ProductNotFoundError(productId);

    const result = await this.productRepository.deactivate(businessId, productId);

    if (!result.idempotent) {
      await this.auditRepository.write({
        actorUserId,
        action: "product.deactivated",
        entityType: "product",
        entityId: productId,
        requestId,
        metadata: { businessId },
      });
    }

    return { productId, idempotent: result.idempotent };
  }

  async registerImageMetadata(
    actorUserId: string,
    businessId: string,
    productId: string,
    input: CreateProductImageRequestDto,
    requestId?: string,
  ): Promise<CreateProductImageMetadataResponseDto> {
    const product = await this.productRepository.findById(businessId, productId);
    if (!product) throw new ProductNotFoundError(productId);

    const imageId = crypto.randomUUID();
    const storagePath = buildCatalogImageStoragePath(
      businessId,
      productId,
      imageId,
      input.originalFileName,
    );

    const image = await this.productRepository.createImage({
      id: imageId,
      productId,
      storagePath,
      altText: input.altText ?? null,
      sortOrder: input.sortOrder,
      isPrimary: input.isPrimary,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "product.image.added",
      entityType: "product_image",
      entityId: image.id,
      requestId,
      metadata: { businessId, productId },
    });

    return {
      image: ProductMapper.toImageDto(image),
      storagePath,
      bucket: PRODUCT_IMAGES_BUCKET,
    };
  }

  async deleteImage(
    actorUserId: string,
    businessId: string,
    productId: string,
    imageId: string,
    requestId?: string,
  ): Promise<{ imageId: string }> {
    const product = await this.productRepository.findById(businessId, productId);
    if (!product) throw new ProductNotFoundError(productId);

    const images = await this.productRepository.listImages(productId);
    if (!images.some((i) => i.id === imageId)) {
      throw new CatalogImageNotFoundError(imageId);
    }

    await this.productRepository.deleteImage(productId, imageId);

    await this.auditRepository.write({
      actorUserId,
      action: "product.image.deleted",
      entityType: "product_image",
      entityId: imageId,
      requestId,
      metadata: { businessId, productId },
    });

    return { imageId };
  }

  async getCompatibility(
    businessId: string,
    productId: string,
  ): Promise<ProductCompatibilityResponseDto[]> {
    const product = await this.productRepository.findById(businessId, productId);
    if (!product) throw new ProductNotFoundError(productId);
    const rows = await this.productRepository.listCompatibility(productId);
    return rows.map(ProductMapper.toCompatibilityDto);
  }

  async replaceCompatibility(
    actorUserId: string,
    businessId: string,
    productId: string,
    input: ReplaceProductCompatibilityRequestDto,
    requestId?: string,
  ): Promise<ProductCompatibilityResponseDto[]> {
    const product = await this.productRepository.findById(businessId, productId);
    if (!product) throw new ProductNotFoundError(productId);

    const items = this.validateCompatibilityItems(input.items);
    const rows = await this.productRepository.replaceCompatibility(
      productId,
      items,
    );

    await this.auditRepository.write({
      actorUserId,
      action: "product.compatibility.updated",
      entityType: "product",
      entityId: productId,
      requestId,
      metadata: { businessId, itemCount: items.length },
    });

    return rows.map(ProductMapper.toCompatibilityDto);
  }
}
