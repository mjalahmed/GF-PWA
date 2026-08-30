import type {
  CompatibilityType,
  ServicePricingType,
} from "../../core/constants/statuses.ts";

export type ServiceImageResponseDto = {
  id: string;
  serviceId: string;
  storagePath: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
};

export type ServiceCompatibilityResponseDto = {
  id: string;
  compatibilityType: CompatibilityType;
  makeId: string | null;
  modelId: string | null;
  minimumYear: number | null;
  maximumYear: number | null;
  createdAt: string;
};

export type ServiceResponseDto = {
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
  images?: ServiceImageResponseDto[];
  compatibility?: ServiceCompatibilityResponseDto[];
};

export type CreateServiceRequestDto = {
  branchId?: string | null;
  categoryId: string;
  name: string;
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

export type UpdateServiceRequestDto = Partial<CreateServiceRequestDto> & {
  name?: string;
};

export type CreateServiceImageRequestDto = {
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
};

export type CreateServiceImageMetadataResponseDto = {
  image: ServiceImageResponseDto;
  storagePath: string;
  bucket: string;
};

export type ReplaceServiceCompatibilityRequestDto = {
  items: Array<{
    compatibilityType: CompatibilityType;
    makeId?: string | null;
    modelId?: string | null;
    minimumYear?: number | null;
    maximumYear?: number | null;
  }>;
};

export type DeactivateServiceResponseDto = {
  serviceId: string;
  idempotent: boolean;
};
