import type {
  CompatibilityRecord,
  CreateServiceImagePersistenceInput,
  CreateServicePersistenceInput,
  ReplaceCompatibilityInput,
  ServiceImageRecord,
  ServiceRecord,
  UpdateServicePersistenceInput,
} from "./service.types.ts";

export interface ServiceRepository {
  listByBusiness(
    businessId: string,
    filters?: { activeOnly?: boolean; branchId?: string; categoryId?: string },
  ): Promise<ServiceRecord[]>;
  findById(businessId: string, serviceId: string): Promise<ServiceRecord | null>;
  create(businessId: string, input: CreateServicePersistenceInput): Promise<ServiceRecord>;
  update(
    businessId: string,
    serviceId: string,
    input: UpdateServicePersistenceInput,
  ): Promise<ServiceRecord>;
  deactivate(businessId: string, serviceId: string): Promise<{ idempotent: boolean }>;
  listImages(serviceId: string): Promise<ServiceImageRecord[]>;
  createImage(input: CreateServiceImagePersistenceInput): Promise<ServiceImageRecord>;
  deleteImage(serviceId: string, imageId: string): Promise<void>;
  listCompatibility(serviceId: string): Promise<CompatibilityRecord[]>;
  replaceCompatibility(
    serviceId: string,
    items: ReplaceCompatibilityInput[],
  ): Promise<CompatibilityRecord[]>;
}
