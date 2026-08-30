import type {
  ClosureDateRow,
  DiscoveryBusinessRecord,
  DiscoverySearchFilters,
  FavoriteRecord,
  OpeningHoursRow,
  PublicImageRecord,
  PublicProductRecord,
  PublicServiceRecord,
  CompatibilitySummaryRecord,
  VehicleFilterContext,
} from "./discovery.types.ts";

export interface DiscoveryRepository {
  searchBusinesses(
    filters: DiscoverySearchFilters,
  ): Promise<{ items: DiscoveryBusinessRecord[]; total: number }>;
  findBusinessBySlug(slug: string): Promise<DiscoveryBusinessRecord | null>;
  findBusinessById(businessId: string): Promise<DiscoveryBusinessRecord | null>;
  getOpeningHours(businessId: string): Promise<OpeningHoursRow[]>;
  getClosureDates(businessId: string): Promise<ClosureDateRow[]>;
  listPublicServices(
    businessId: string,
    filters?: { categoryId?: string; vehicle?: VehicleFilterContext },
    pagination?: { page: number; pageSize: number },
  ): Promise<{ items: PublicServiceRecord[]; total: number }>;
  listPublicProducts(
    businessId: string,
    filters?: { categoryId?: string; vehicle?: VehicleFilterContext },
    pagination?: { page: number; pageSize: number },
  ): Promise<{ items: PublicProductRecord[]; total: number }>;
  getServiceImages(serviceIds: string[]): Promise<Map<string, PublicImageRecord[]>>;
  getProductImages(productIds: string[]): Promise<Map<string, PublicImageRecord[]>>;
  getServiceCompatibility(
    serviceIds: string[],
  ): Promise<Map<string, CompatibilitySummaryRecord[]>>;
  getProductCompatibility(
    productIds: string[],
  ): Promise<Map<string, CompatibilitySummaryRecord[]>>;
  listFavorites(customerId: string): Promise<FavoriteRecord[]>;
  addFavorite(customerId: string, businessId: string): Promise<FavoriteRecord>;
  removeFavorite(customerId: string, businessId: string): Promise<void>;
  findVehicleForFilter(
    vehicleId: string,
    customerId?: string,
  ): Promise<VehicleFilterContext | null>;
  businessIdsWithMatchingCatalog(input: {
    businessIds: string[];
    vehicle: VehicleFilterContext;
    catalog: "services" | "products";
    categoryId?: string;
  }): Promise<Set<string>>;
}
