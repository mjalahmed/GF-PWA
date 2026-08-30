import type { VehicleResponseDto } from "./vehicle.dto.ts";
import type { VehicleRecord } from "./vehicle.types.ts";

export class VehicleMapper {
  static toDto(record: VehicleRecord): VehicleResponseDto {
    return {
      id: record.id,
      customerId: record.customerId,
      makeId: record.makeId,
      modelId: record.modelId,
      makeText: record.makeText,
      modelText: record.modelText,
      year: record.year,
      trim: record.trim,
      engine: record.engine,
      vin: record.vin,
      registrationNumber: record.registrationNumber,
      color: record.color,
      mileage: record.mileage,
      mileageUnit: record.mileageUnit,
      imagePath: record.imagePath,
      isDefault: record.isDefault,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
