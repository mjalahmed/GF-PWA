import type {
  ProductCompatibilityResponseDto,
  ProductImageResponseDto,
  ProductResponseDto,
} from "./product.dto.ts";
import type {
  ProductCompatibilityRecord,
  ProductImageRecord,
  ProductRecord,
} from "./product.types.ts";

export class ProductMapper {
  static toDto(record: ProductRecord): ProductResponseDto {
    return {
      id: record.id,
      businessId: record.businessId,
      branchId: record.branchId,
      categoryId: record.categoryId,
      name: record.name,
      slug: record.slug,
      description: record.description,
      sku: record.sku,
      brand: record.brand,
      price: record.price,
      salePrice: record.salePrice,
      stockStatus: record.stockStatus,
      warrantyDescription: record.warrantyDescription,
      installationAvailable: record.installationAvailable,
      isActive: record.isActive,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toImageDto(record: ProductImageRecord): ProductImageResponseDto {
    return {
      id: record.id,
      productId: record.productId,
      storagePath: record.storagePath,
      altText: record.altText,
      sortOrder: record.sortOrder,
      isPrimary: record.isPrimary,
      createdAt: record.createdAt,
    };
  }

  static toCompatibilityDto(
    record: ProductCompatibilityRecord,
  ): ProductCompatibilityResponseDto {
    return {
      id: record.id,
      compatibilityType: record.compatibilityType,
      makeId: record.makeId,
      modelId: record.modelId,
      minimumYear: record.minimumYear,
      maximumYear: record.maximumYear,
      createdAt: record.createdAt,
    };
  }

  static toDetailDto(input: {
    product: ProductRecord;
    images: ProductImageRecord[];
    compatibility: ProductCompatibilityRecord[];
  }): ProductResponseDto {
    return {
      ...ProductMapper.toDto(input.product),
      images: input.images.map(ProductMapper.toImageDto),
      compatibility: input.compatibility.map(ProductMapper.toCompatibilityDto),
    };
  }
}
