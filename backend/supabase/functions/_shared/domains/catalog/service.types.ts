import type {
  CompatibilityType,
  ServicePricingType,
} from "../../core/constants/statuses.ts";

export type ServiceRecord = {
  id: string;
  businessId: string;
  branchId: string | null;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  pricingType: ServicePricingType;
  price: number | null;
  minimumPrice: number | null;
  maximumPrice: number | null;
  estimatedDurationMinutes: number | null;
  requiresAppointment: boolean;
  requiresVehicle: boolean;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ServiceImageRecord = {
  id: string;
  serviceId: string;
  storagePath: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
};

export type CompatibilityRecord = {
  id: string;
  compatibilityType: CompatibilityType;
  makeId: string | null;
  modelId: string | null;
  minimumYear: number | null;
  maximumYear: number | null;
  createdAt: string;
};

export type CreateServicePersistenceInput = {
  branchId?: string | null;
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  pricingType: ServicePricingType;
  price?: number | null;
  minimumPrice?: number | null;
  maximumPrice?: number | null;
  estimatedDurationMinutes?: number | null;
  requiresAppointment?: boolean;
  requiresVehicle?: boolean;
  metadata?: Record<string, unknown>;
};

export type UpdateServicePersistenceInput = Partial<
  Omit<CreateServicePersistenceInput, "slug">
> & { slug?: string };

export type CreateServiceImagePersistenceInput = {
  id: string;
  serviceId: string;
  storagePath: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type ReplaceCompatibilityInput = {
  compatibilityType: CompatibilityType;
  makeId?: string | null;
  modelId?: string | null;
  minimumYear?: number | null;
  maximumYear?: number | null;
};

export const SERVICE_IMAGES_BUCKET = "service-images";
