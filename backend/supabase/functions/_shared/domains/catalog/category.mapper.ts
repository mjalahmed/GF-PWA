import type {
  ProductCategoryResponseDto,
  ServiceCategoryResponseDto,
  VehicleMakeResponseDto,
  VehicleModelResponseDto,
} from "./category.dto.ts";
import type {
  ProductCategoryRecord,
  ServiceCategoryRecord,
  VehicleMakeRecord,
  VehicleModelRecord,
} from "./category.types.ts";

export class CategoryMapper {
  static toServiceCategoryDto(
    record: ServiceCategoryRecord,
  ): ServiceCategoryResponseDto {
    return {
      id: record.id,
      parentId: record.parentId,
      code: record.code,
      name: record.name,
      description: record.description,
      icon: record.icon,
      sortOrder: record.sortOrder,
    };
  }

  static toProductCategoryDto(
    record: ProductCategoryRecord,
  ): ProductCategoryResponseDto {
    return {
      id: record.id,
      parentId: record.parentId,
      code: record.code,
      name: record.name,
      description: record.description,
      icon: record.icon,
      sortOrder: record.sortOrder,
    };
  }

  static toVehicleMakeDto(record: VehicleMakeRecord): VehicleMakeResponseDto {
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
    };
  }

  static toVehicleModelDto(record: VehicleModelRecord): VehicleModelResponseDto {
    return {
      id: record.id,
      makeId: record.makeId,
      name: record.name,
      slug: record.slug,
      startYear: record.startYear,
      endYear: record.endYear,
    };
  }
}
