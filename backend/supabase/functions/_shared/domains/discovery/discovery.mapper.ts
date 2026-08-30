import type {
  CompatibilitySummaryDto,
  DiscoveryBusinessDetailDto,
  DiscoveryBusinessSummaryDto,
  FavoriteBusinessDto,
  PublicCategoryRefDto,
  PublicImageDto,
  PublicProductDto,
  PublicServiceDto,
} from "./discovery.dto.ts";
import type {
  CompatibilitySummaryRecord,
  DiscoveryBusinessRecord,
  FavoriteRecord,
  PublicImageRecord,
  PublicProductRecord,
  PublicServiceRecord,
} from "./discovery.types.ts";
import type { BusinessBranchRecord } from "../business-management/business.types.ts";
import { evaluateOpenNow, haversineDistanceKm } from "./discovery.utils.ts";

export class DiscoveryMapper {
  static toPublicBranch(branch: BusinessBranchRecord) {
    return {
      id: branch.id,
      name: branch.name,
      phone: branch.phone,
      addressLine: branch.addressLine,
      area: branch.area,
      city: branch.city,
      countryCode: branch.countryCode,
      latitude: branch.latitude,
      longitude: branch.longitude,
      timezone: branch.timezone,
      isPrimary: branch.isPrimary,
    };
  }

  static toSummaryDto(input: {
    business: DiscoveryBusinessRecord;
    openingState?: { isOpen: boolean; branchId: string | null; branchName: string | null } | null;
    distanceKm?: number | null;
  }): DiscoveryBusinessSummaryDto {
    const activeBranches = input.business.branches.filter((b) => b.isActive);
    const areas = [
      ...new Set(
        activeBranches
          .map((b) => b.area)
          .filter((a): a is string => Boolean(a)),
      ),
    ];

    return {
      id: input.business.id,
      slug: input.business.slug,
      displayName: input.business.displayName,
      description: input.business.description,
      logoPath: input.business.logoPath,
      coverPath: input.business.coverPath,
      businessCategoryId: input.business.businessCategoryId,
      verificationStatus: input.business.verificationStatus,
      averageRating: input.business.averageRating,
      ratingCount: input.business.ratingCount,
      areas,
      branches: activeBranches.map(DiscoveryMapper.toPublicBranch),
      openingState: input.openingState ?? null,
      serviceCount: input.business.serviceCount,
      productCount: input.business.productCount,
      distanceKm: input.distanceKm ?? null,
    };
  }

  static toDetailDto(input: {
    business: DiscoveryBusinessRecord;
    openingHours: Parameters<typeof evaluateOpenNow>[0]["openingHours"];
    closureDates: Parameters<typeof evaluateOpenNow>[0]["closureDates"];
    latitude?: number;
    longitude?: number;
  }): DiscoveryBusinessDetailDto {
    const openingState = evaluateOpenNow({
      branches: input.business.branches.map((b) => ({
        id: b.id,
        name: b.name,
        isActive: b.isActive,
        isPrimary: b.isPrimary,
      })),
      openingHours: input.openingHours,
      closureDates: input.closureDates,
    });

    let distanceKm: number | null = null;
    if (input.latitude != null && input.longitude != null) {
      const primary = input.business.branches.find((b) =>
        b.isPrimary && b.isActive && b.latitude != null && b.longitude != null
      ) ?? input.business.branches.find((b) =>
        b.isActive && b.latitude != null && b.longitude != null
      );
      if (primary?.latitude != null && primary.longitude != null) {
        distanceKm = haversineDistanceKm(
          input.latitude,
          input.longitude,
          primary.latitude,
          primary.longitude,
        );
      }
    }

    return DiscoveryMapper.toSummaryDto({
      business: input.business,
      openingState,
      distanceKm,
    });
  }

  static toCategoryRef(input: {
    id: string;
    code: string;
    name: string;
  }): PublicCategoryRefDto {
    return { id: input.id, code: input.code, name: input.name };
  }

  static toPublicImage(record: PublicImageRecord): PublicImageDto {
    return {
      id: record.id,
      storagePath: record.storagePath,
      altText: record.altText,
      sortOrder: record.sortOrder,
      isPrimary: record.isPrimary,
    };
  }

  static toCompatibilitySummary(
    record: CompatibilitySummaryRecord,
  ): CompatibilitySummaryDto {
    return {
      compatibilityType: record.compatibilityType,
      makeId: record.makeId,
      modelId: record.modelId,
      minimumYear: record.minimumYear,
      maximumYear: record.maximumYear,
    };
  }

  static toPublicService(input: {
    service: PublicServiceRecord;
    category: PublicCategoryRefDto;
    images: PublicImageRecord[];
    compatibility: CompatibilitySummaryRecord[];
  }): PublicServiceDto {
    return {
      id: input.service.id,
      slug: input.service.slug,
      name: input.service.name,
      description: input.service.description,
      category: input.category,
      pricingType: input.service.pricingType,
      price: input.service.price,
      minimumPrice: input.service.minimumPrice,
      maximumPrice: input.service.maximumPrice,
      estimatedDurationMinutes: input.service.estimatedDurationMinutes,
      requiresAppointment: input.service.requiresAppointment,
      requiresVehicle: input.service.requiresVehicle,
      images: input.images.map(DiscoveryMapper.toPublicImage),
      compatibilitySummary: input.compatibility.map(
        DiscoveryMapper.toCompatibilitySummary,
      ),
    };
  }

  static toPublicProduct(input: {
    product: PublicProductRecord;
    category: PublicCategoryRefDto;
    images: PublicImageRecord[];
    compatibility: CompatibilitySummaryRecord[];
  }): PublicProductDto {
    return {
      id: input.product.id,
      slug: input.product.slug,
      name: input.product.name,
      description: input.product.description,
      category: input.category,
      brand: input.product.brand,
      price: input.product.price,
      salePrice: input.product.salePrice,
      stockStatus: input.product.stockStatus,
      warrantyDescription: input.product.warrantyDescription,
      installationAvailable: input.product.installationAvailable,
      images: input.images.map(DiscoveryMapper.toPublicImage),
      compatibilitySummary: input.compatibility.map(
        DiscoveryMapper.toCompatibilitySummary,
      ),
    };
  }

  static toFavoriteDto(input: {
    favorite: FavoriteRecord;
    business: DiscoveryBusinessSummaryDto | null;
  }): FavoriteBusinessDto {
    return {
      favoriteId: input.favorite.id,
      businessId: input.favorite.businessId,
      createdAt: input.favorite.createdAt,
      business: input.business,
    };
  }
}
