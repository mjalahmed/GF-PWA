import type {
  CompatibilityType,
  ProductStockStatus,
  ServicePricingType,
} from "../../core/constants/statuses.ts";

export type PublicBranchDto = {
  id: string;
  name: string;
  phone: string | null;
  addressLine: string;
  area: string | null;
  city: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  isPrimary: boolean;
};

export type OpeningStateDto = {
  isOpen: boolean;
  branchId: string | null;
  branchName: string | null;
};

export type DiscoveryBusinessSummaryDto = {
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
  areas: string[];
  branches: PublicBranchDto[];
  openingState: OpeningStateDto | null;
  temporarilyClosed: boolean;
  serviceCount: number;
  productCount: number;
  distanceKm: number | null;
};

export type PublicOpeningHoursDto = {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
};

export type DiscoveryBusinessDetailDto = DiscoveryBusinessSummaryDto & {
  temporarilyClosed: boolean;
  temporaryClosureReason: string | null;
  openingHours: PublicOpeningHoursDto[];
};

export type PublicCategoryRefDto = {
  id: string;
  code: string;
  name: string;
};

export type PublicImageDto = {
  id: string;
  storagePath: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type CompatibilitySummaryDto = {
  compatibilityType: CompatibilityType;
  makeId: string | null;
  modelId: string | null;
  minimumYear: number | null;
  maximumYear: number | null;
};

export type PublicServiceDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: PublicCategoryRefDto;
  pricingType: ServicePricingType;
  price: number | null;
  minimumPrice: number | null;
  maximumPrice: number | null;
  estimatedDurationMinutes: number | null;
  requiresAppointment: boolean;
  requiresVehicle: boolean;
  images: PublicImageDto[];
  compatibilitySummary: CompatibilitySummaryDto[];
};

export type PublicProductDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: PublicCategoryRefDto;
  brand: string | null;
  price: number;
  salePrice: number | null;
  stockStatus: ProductStockStatus;
  warrantyDescription: string | null;
  installationAvailable: boolean;
  images: PublicImageDto[];
  compatibilitySummary: CompatibilitySummaryDto[];
};

export type FavoriteBusinessDto = {
  favoriteId: string;
  businessId: string;
  createdAt: string;
  business: DiscoveryBusinessSummaryDto | null;
};

export type AddFavoriteResponseDto = {
  favoriteId: string;
  businessId: string;
  createdAt: string;
};
