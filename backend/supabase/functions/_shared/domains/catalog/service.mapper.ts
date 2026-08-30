import type {
  ServiceCompatibilityResponseDto,
  ServiceImageResponseDto,
  ServiceResponseDto,
} from "./service.dto.ts";
import type {
  CompatibilityRecord,
  ServiceImageRecord,
  ServiceRecord,
} from "./service.types.ts";

export class ServiceMapper {
  static toDto(record: ServiceRecord): ServiceResponseDto {
    return {
      id: record.id,
      businessId: record.businessId,
      branchId: record.branchId,
      categoryId: record.categoryId,
      name: record.name,
      slug: record.slug,
      description: record.description,
      pricingType: record.pricingType,
      price: record.price,
      minimumPrice: record.minimumPrice,
      maximumPrice: record.maximumPrice,
      estimatedDurationMinutes: record.estimatedDurationMinutes,
      requiresAppointment: record.requiresAppointment,
      requiresVehicle: record.requiresVehicle,
      isActive: record.isActive,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toImageDto(record: ServiceImageRecord): ServiceImageResponseDto {
    return {
      id: record.id,
      serviceId: record.serviceId,
      storagePath: record.storagePath,
      altText: record.altText,
      sortOrder: record.sortOrder,
      isPrimary: record.isPrimary,
      createdAt: record.createdAt,
    };
  }

  static toCompatibilityDto(
    record: CompatibilityRecord,
  ): ServiceCompatibilityResponseDto {
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
    service: ServiceRecord;
    images: ServiceImageRecord[];
    compatibility: CompatibilityRecord[];
  }): ServiceResponseDto {
    return {
      ...ServiceMapper.toDto(input.service),
      images: input.images.map(ServiceMapper.toImageDto),
      compatibility: input.compatibility.map(ServiceMapper.toCompatibilityDto),
    };
  }
}
