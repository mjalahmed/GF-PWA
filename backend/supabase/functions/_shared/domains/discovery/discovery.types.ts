import type { BusinessBranchRecord } from "../business-management/business.types.ts";
import type { CompatibilityType, ProductStockStatus, ServicePricingType } from "../../core/constants/statuses.ts";

export type DiscoverySort = "relevance" | "rating" | "newest" | "distance" | "name";

export type DiscoverySearchFilters = {
  query?: string;
  businessCategory?: string;
  serviceCategory?: string;
  productCategory?: string;
  area?: string;
  city?: string;
  minimumRating?: number;
  openNow?: boolean;
  vehicleId?: string;
  vehicleMakeId?: string;
  vehicleModelId?: string;
  vehicleYear?: number;
  hasServices?: boolean;
  hasProducts?: boolean;
  latitude?: number;
  longitude?: number;
  page: number;
  pageSize: number;
  sort: DiscoverySort;
};

export type DiscoveryBusinessRecord = {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  logoPath: string | null;
  coverPath: string | null;
  businessCategoryId: string;
  verificationStatus: string;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  branches: BusinessBranchRecord[];
  serviceCount: number;
  productCount: number;
};

export type OpeningHoursRow = {
  businessId: string;
  branchId: string | null;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type ClosureDateRow = {
  businessId: string;
  branchId: string | null;
  closureDate: string;
  isFullDay: boolean;
  opensAt: string | null;
  closesAt: string | null;
};

export type PublicServiceRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string;
  pricingType: ServicePricingType;
  price: number | null;
  minimumPrice: number | null;
  maximumPrice: number | null;
  estimatedDurationMinutes: number | null;
  requiresAppointment: boolean;
  requiresVehicle: boolean;
};

export type PublicProductRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string;
  brand: string | null;
  price: number;
  salePrice: number | null;
  stockStatus: ProductStockStatus;
  warrantyDescription: string | null;
  installationAvailable: boolean;
};

export type PublicImageRecord = {
  id: string;
  storagePath: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type CompatibilitySummaryRecord = {
  compatibilityType: CompatibilityType;
  makeId: string | null;
  modelId: string | null;
  minimumYear: number | null;
  maximumYear: number | null;
};

export type FavoriteRecord = {
  id: string;
  customerId: string;
  businessId: string;
  createdAt: string;
};

export type VehicleFilterContext = {
  makeId: string | null;
  modelId: string | null;
  year: number | null;
};
