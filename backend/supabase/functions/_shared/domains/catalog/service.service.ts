import { ValidationError } from "../../core/errors/app-error.ts";
import { slugify } from "../../core/utils/slugify.ts";
import { CompatibilityTypes } from "../../core/constants/statuses.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BranchRepository } from "../business-management/branch.repository.interface.ts";
import type { CategoryRepository } from "./category.repository.interface.ts";
import type { ServiceRepository } from "./service.repository.interface.ts";
import {
  BranchBusinessMismatchError,
  CatalogImageNotFoundError,
  CategoryNotFoundError,
  ServiceNotFoundError,
  buildCatalogImageStoragePath,
} from "./catalog.errors.ts";
import {
  validateServicePricing,
} from "./catalog.validation.ts";
import { ServiceMapper } from "./service.mapper.ts";
import type {
  CreateServiceImageMetadataResponseDto,
  CreateServiceImageRequestDto,
  CreateServiceRequestDto,
  DeactivateServiceResponseDto,
  ReplaceServiceCompatibilityRequestDto,
  ServiceCompatibilityResponseDto,
  ServiceResponseDto,
  UpdateServiceRequestDto,
} from "./service.dto.ts";
import type { ReplaceCompatibilityInput } from "./service.types.ts";
import { SERVICE_IMAGES_BUCKET } from "./service.types.ts";

export class ServiceService {
  constructor(
    private readonly serviceRepository: ServiceRepository,
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

  private async assertServiceCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findServiceCategoryById(
      categoryId,
    );
    if (!category) throw new CategoryNotFoundError(categoryId);
  }

  private validateCompatibilityItems(
    items: ReplaceServiceCompatibilityRequestDto["items"],
  ): ReplaceCompatibilityInput[] {
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
  ): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.listByBusiness(
      businessId,
      filters,
    );
    return services.map(ServiceMapper.toDto);
  }

  async getById(
    businessId: string,
    serviceId: string,
  ): Promise<ServiceResponseDto> {
    const service = await this.serviceRepository.findById(businessId, serviceId);
    if (!service) throw new ServiceNotFoundError(serviceId);
    const [images, compatibility] = await Promise.all([
      this.serviceRepository.listImages(serviceId),
      this.serviceRepository.listCompatibility(serviceId),
    ]);
    return ServiceMapper.toDetailDto({ service, images, compatibility });
  }

  async create(
    actorUserId: string,
    businessId: string,
    input: CreateServiceRequestDto,
    requestId?: string,
  ): Promise<ServiceResponseDto> {
    await this.assertBranch(businessId, input.branchId);
    await this.assertServiceCategory(input.categoryId);
    validateServicePricing(input);

    const slug = slugify(input.name);
    const service = await this.serviceRepository.create(businessId, {
      branchId: input.branchId ?? null,
      categoryId: input.categoryId,
      name: input.name,
      slug,
      description: input.description ?? null,
      pricingType: input.pricingType,
      price: input.price ?? null,
      minimumPrice: input.minimumPrice ?? null,
      maximumPrice: input.maximumPrice ?? null,
      estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
      requiresAppointment: input.requiresAppointment,
      requiresVehicle: input.requiresVehicle,
      metadata: input.metadata,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "service.created",
      entityType: "service",
      entityId: service.id,
      requestId,
      metadata: { businessId },
    });

    return ServiceMapper.toDto(service);
  }

  async update(
    actorUserId: string,
    businessId: string,
    serviceId: string,
    input: UpdateServiceRequestDto,
    requestId?: string,
  ): Promise<ServiceResponseDto> {
    const existing = await this.serviceRepository.findById(
      businessId,
      serviceId,
    );
    if (!existing) throw new ServiceNotFoundError(serviceId);

    if (input.branchId !== undefined) {
      await this.assertBranch(businessId, input.branchId);
    }
    if (input.categoryId) await this.assertServiceCategory(input.categoryId);

    const pricingType = input.pricingType ?? existing.pricingType;
    validateServicePricing({
      pricingType,
      price: input.price !== undefined ? input.price : existing.price,
      minimumPrice: input.minimumPrice !== undefined
        ? input.minimumPrice
        : existing.minimumPrice,
      maximumPrice: input.maximumPrice !== undefined
        ? input.maximumPrice
        : existing.maximumPrice,
    });

    const updated = await this.serviceRepository.update(businessId, serviceId, {
      ...input,
      slug: input.name ? slugify(input.name) : undefined,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "service.updated",
      entityType: "service",
      entityId: serviceId,
      requestId,
      metadata: { businessId },
    });

    return ServiceMapper.toDto(updated);
  }

  async deactivate(
    actorUserId: string,
    businessId: string,
    serviceId: string,
    requestId?: string,
  ): Promise<DeactivateServiceResponseDto> {
    const existing = await this.serviceRepository.findById(
      businessId,
      serviceId,
    );
    if (!existing) throw new ServiceNotFoundError(serviceId);

    const result = await this.serviceRepository.deactivate(businessId, serviceId);

    if (!result.idempotent) {
      await this.auditRepository.write({
        actorUserId,
        action: "service.deactivated",
        entityType: "service",
        entityId: serviceId,
        requestId,
        metadata: { businessId },
      });
    }

    return { serviceId, idempotent: result.idempotent };
  }

  async registerImageMetadata(
    actorUserId: string,
    businessId: string,
    serviceId: string,
    input: CreateServiceImageRequestDto,
    requestId?: string,
  ): Promise<CreateServiceImageMetadataResponseDto> {
    const service = await this.serviceRepository.findById(businessId, serviceId);
    if (!service) throw new ServiceNotFoundError(serviceId);

    const imageId = crypto.randomUUID();
    const storagePath = buildCatalogImageStoragePath(
      businessId,
      serviceId,
      imageId,
      input.originalFileName,
    );

    const image = await this.serviceRepository.createImage({
      id: imageId,
      serviceId,
      storagePath,
      altText: input.altText ?? null,
      sortOrder: input.sortOrder,
      isPrimary: input.isPrimary,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "service.image.added",
      entityType: "service_image",
      entityId: image.id,
      requestId,
      metadata: { businessId, serviceId },
    });

    return {
      image: ServiceMapper.toImageDto(image),
      storagePath,
      bucket: SERVICE_IMAGES_BUCKET,
    };
  }

  async deleteImage(
    actorUserId: string,
    businessId: string,
    serviceId: string,
    imageId: string,
    requestId?: string,
  ): Promise<{ imageId: string }> {
    const service = await this.serviceRepository.findById(businessId, serviceId);
    if (!service) throw new ServiceNotFoundError(serviceId);

    const images = await this.serviceRepository.listImages(serviceId);
    if (!images.some((i) => i.id === imageId)) {
      throw new CatalogImageNotFoundError(imageId);
    }

    await this.serviceRepository.deleteImage(serviceId, imageId);

    await this.auditRepository.write({
      actorUserId,
      action: "service.image.deleted",
      entityType: "service_image",
      entityId: imageId,
      requestId,
      metadata: { businessId, serviceId },
    });

    return { imageId };
  }

  async getCompatibility(
    businessId: string,
    serviceId: string,
  ): Promise<ServiceCompatibilityResponseDto[]> {
    const service = await this.serviceRepository.findById(businessId, serviceId);
    if (!service) throw new ServiceNotFoundError(serviceId);
    const rows = await this.serviceRepository.listCompatibility(serviceId);
    return rows.map(ServiceMapper.toCompatibilityDto);
  }

  async replaceCompatibility(
    actorUserId: string,
    businessId: string,
    serviceId: string,
    input: ReplaceServiceCompatibilityRequestDto,
    requestId?: string,
  ): Promise<ServiceCompatibilityResponseDto[]> {
    const service = await this.serviceRepository.findById(businessId, serviceId);
    if (!service) throw new ServiceNotFoundError(serviceId);

    const items = this.validateCompatibilityItems(input.items);
    const rows = await this.serviceRepository.replaceCompatibility(
      serviceId,
      items,
    );

    await this.auditRepository.write({
      actorUserId,
      action: "service.compatibility.updated",
      entityType: "service",
      entityId: serviceId,
      requestId,
      metadata: { businessId, itemCount: items.length },
    });

    return rows.map(ServiceMapper.toCompatibilityDto);
  }
}
