import type { PaginationMeta } from "../../core/types/context.ts";
import type { CategoryRepository } from "../catalog/category.repository.interface.ts";
import type { DiscoveryRepository } from "./discovery.repository.interface.ts";
import { DiscoveryBusinessNotFoundError } from "./discovery.repository.ts";
import { DiscoveryMapper } from "./discovery.mapper.ts";
import type {
  AddFavoriteResponseDto,
  DiscoveryBusinessDetailDto,
  DiscoveryBusinessSummaryDto,
  FavoriteBusinessDto,
  PublicProductDto,
  PublicServiceDto,
} from "./discovery.dto.ts";
import type { DiscoverySearchFilters, VehicleFilterContext } from "./discovery.types.ts";
import { evaluateOpenNow, haversineDistanceKm } from "./discovery.utils.ts";
import type { DiscoverySearchQueryDto } from "./discovery.schemas.ts";

export class DiscoveryService {
  constructor(
    private readonly discoveryRepository: DiscoveryRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  private async resolveVehicleFilter(input: {
    vehicleId?: string;
    vehicleMakeId?: string;
    vehicleModelId?: string;
    vehicleYear?: number;
    customerId?: string;
  }): Promise<VehicleFilterContext | undefined> {
    if (input.vehicleId) {
      const vehicle = await this.discoveryRepository.findVehicleForFilter(
        input.vehicleId,
        input.customerId,
      );
      if (!vehicle) return undefined;
      return vehicle;
    }
    if (input.vehicleMakeId || input.vehicleModelId || input.vehicleYear) {
      return {
        makeId: input.vehicleMakeId ?? null,
        modelId: input.vehicleModelId ?? null,
        year: input.vehicleYear ?? null,
      };
    }
    return undefined;
  }

  async searchBusinesses(
    query: DiscoverySearchQueryDto,
    customerId?: string,
  ): Promise<{ items: DiscoveryBusinessSummaryDto[]; pagination: PaginationMeta }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const vehicle = await this.resolveVehicleFilter({ ...query, customerId });
    const needsPostFilter = Boolean(query.openNow || vehicle);

    const filters: DiscoverySearchFilters = {
      query: query.query,
      businessCategory: query.businessCategory,
      serviceCategory: query.serviceCategory,
      productCategory: query.productCategory,
      area: query.area,
      city: query.city,
      minimumRating: query.minimumRating,
      openNow: query.openNow,
      vehicleId: query.vehicleId,
      vehicleMakeId: query.vehicleMakeId,
      vehicleModelId: query.vehicleModelId,
      vehicleYear: query.vehicleYear,
      hasServices: query.hasServices,
      hasProducts: query.hasProducts,
      latitude: query.latitude,
      longitude: query.longitude,
      page: needsPostFilter ? 1 : page,
      pageSize: needsPostFilter ? 500 : pageSize,
      sort: query.sort ?? "relevance",
    };

    let { items } = await this.discoveryRepository.searchBusinesses(filters);

    if (vehicle) {
      const businessIds = items.map((i) => i.id);
      const catalogs: Array<"services" | "products"> = query.serviceCategory
        ? ["services"]
        : query.productCategory
        ? ["products"]
        : ["services", "products"];
      const matching = new Set<string>();
      for (const catalog of catalogs) {
        const ids = await this.discoveryRepository.businessIdsWithMatchingCatalog({
          businessIds,
          vehicle,
          catalog,
          categoryId: catalog === "services"
            ? query.serviceCategory
            : query.productCategory,
        });
        for (const id of ids) matching.add(id);
      }
      items = items.filter((i) => matching.has(i.id));
    }

    let summaries = await Promise.all(items.map(async (business) => {
      const [openingHours, closureDates] = await Promise.all([
        this.discoveryRepository.getOpeningHours(business.id),
        this.discoveryRepository.getClosureDates(business.id),
      ]);

      const openingState = evaluateOpenNow({
        branches: business.branches.map((b) => ({
          id: b.id,
          name: b.name,
          isActive: b.isActive,
          isPrimary: b.isPrimary,
        })),
        openingHours: openingHours.map((h) => ({
          branchId: h.branchId,
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          isClosed: h.isClosed,
        })),
        closureDates: closureDates.map((c) => ({
          branchId: c.branchId,
          closureDate: c.closureDate,
          isFullDay: c.isFullDay,
          opensAt: c.opensAt,
          closesAt: c.closesAt,
        })),
      });

      let distanceKm: number | null = null;
      if (query.latitude != null && query.longitude != null) {
        const branch = business.branches.find((b) =>
          b.isPrimary && b.latitude != null && b.longitude != null
        ) ?? business.branches.find((b) => b.latitude != null && b.longitude != null);
        if (branch?.latitude != null && branch.longitude != null) {
          distanceKm = haversineDistanceKm(
            query.latitude,
            query.longitude,
            branch.latitude,
            branch.longitude,
          );
        }
      }

      return DiscoveryMapper.toSummaryDto({ business, openingState, distanceKm });
    }));

    if (query.openNow) {
      summaries = summaries.filter((s) => s.openingState?.isOpen === true);
    }

    if (filters.sort === "distance" && query.latitude != null && query.longitude != null) {
      summaries.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    const total = summaries.length;
    const start = (page - 1) * pageSize;
    summaries = summaries.slice(start, start + pageSize);

    return {
      items: summaries,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getBusinessBySlug(
    slug: string,
    latitude?: number,
    longitude?: number,
  ): Promise<DiscoveryBusinessDetailDto> {
    const business = await this.discoveryRepository.findBusinessBySlug(slug);
    if (!business) throw new DiscoveryBusinessNotFoundError(slug);

    const [openingHours, closureDates] = await Promise.all([
      this.discoveryRepository.getOpeningHours(business.id),
      this.discoveryRepository.getClosureDates(business.id),
    ]);

    return DiscoveryMapper.toDetailDto({
      business,
      openingHours: openingHours.map((h) => ({
        branchId: h.branchId,
        dayOfWeek: h.dayOfWeek,
        opensAt: h.opensAt,
        closesAt: h.closesAt,
        isClosed: h.isClosed,
      })),
      closureDates: closureDates.map((c) => ({
        branchId: c.branchId,
        closureDate: c.closureDate,
        isFullDay: c.isFullDay,
        opensAt: c.opensAt,
        closesAt: c.closesAt,
      })),
      latitude,
      longitude,
    });
  }

  async listPublicServices(
    slug: string,
    query: { categoryId?: string; vehicleId?: string; page?: number; pageSize?: number },
    customerId?: string,
  ): Promise<{ items: PublicServiceDto[]; pagination: PaginationMeta }> {
    const business = await this.discoveryRepository.findBusinessBySlug(slug);
    if (!business) throw new DiscoveryBusinessNotFoundError(slug);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const vehicle = query.vehicleId
      ? await this.discoveryRepository.findVehicleForFilter(
        query.vehicleId,
        customerId,
      ) ?? undefined
      : undefined;

    const { items, total } = await this.discoveryRepository.listPublicServices(
      business.id,
      { categoryId: query.categoryId, vehicle },
      { page, pageSize },
    );

    const categories = await this.categoryRepository.listServiceCategories();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const serviceIds = items.map((i) => i.id);
    const [images, compatibility] = await Promise.all([
      this.discoveryRepository.getServiceImages(serviceIds),
      this.discoveryRepository.getServiceCompatibility(serviceIds),
    ]);

    return {
      items: items.map((service) => {
        const category = categoryMap.get(service.categoryId);
        return DiscoveryMapper.toPublicService({
          service,
          category: category
            ? DiscoveryMapper.toCategoryRef(category)
            : { id: service.categoryId, code: "unknown", name: "Unknown" },
          images: images.get(service.id) ?? [],
          compatibility: compatibility.get(service.id) ?? [],
        });
      }),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async listPublicProducts(
    slug: string,
    query: { categoryId?: string; vehicleId?: string; page?: number; pageSize?: number },
    customerId?: string,
  ): Promise<{ items: PublicProductDto[]; pagination: PaginationMeta }> {
    const business = await this.discoveryRepository.findBusinessBySlug(slug);
    if (!business) throw new DiscoveryBusinessNotFoundError(slug);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const vehicle = query.vehicleId
      ? await this.discoveryRepository.findVehicleForFilter(
        query.vehicleId,
        customerId,
      ) ?? undefined
      : undefined;

    const { items, total } = await this.discoveryRepository.listPublicProducts(
      business.id,
      { categoryId: query.categoryId, vehicle },
      { page, pageSize },
    );

    const categories = await this.categoryRepository.listProductCategories();
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const productIds = items.map((i) => i.id);
    const [images, compatibility] = await Promise.all([
      this.discoveryRepository.getProductImages(productIds),
      this.discoveryRepository.getProductCompatibility(productIds),
    ]);

    return {
      items: items.map((product) => {
        const category = categoryMap.get(product.categoryId);
        return DiscoveryMapper.toPublicProduct({
          product,
          category: category
            ? DiscoveryMapper.toCategoryRef(category)
            : { id: product.categoryId, code: "unknown", name: "Unknown" },
          images: images.get(product.id) ?? [],
          compatibility: compatibility.get(product.id) ?? [],
        });
      }),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async listFavorites(customerId: string): Promise<FavoriteBusinessDto[]> {
    const favorites = await this.discoveryRepository.listFavorites(customerId);
    const results: FavoriteBusinessDto[] = [];

    for (const favorite of favorites) {
      const business = await this.discoveryRepository.findBusinessById(
        favorite.businessId,
      );
      const summary = business
        ? DiscoveryMapper.toSummaryDto({ business })
        : null;
      results.push(DiscoveryMapper.toFavoriteDto({ favorite, business: summary }));
    }
    return results;
  }

  async addFavorite(
    customerId: string,
    businessId: string,
  ): Promise<AddFavoriteResponseDto> {
    const favorite = await this.discoveryRepository.addFavorite(
      customerId,
      businessId,
    );
    return {
      favoriteId: favorite.id,
      businessId: favorite.businessId,
      createdAt: favorite.createdAt,
    };
  }

  async removeFavorite(customerId: string, businessId: string): Promise<void> {
    await this.discoveryRepository.removeFavorite(customerId, businessId);
  }
}
