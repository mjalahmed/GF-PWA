import type {
  ProductCategoryRecord,
  ServiceCategoryRecord,
  VehicleMakeRecord,
  VehicleModelRecord,
} from "./category.types.ts";

export interface CategoryRepository {
  listServiceCategories(): Promise<ServiceCategoryRecord[]>;
  listProductCategories(): Promise<ProductCategoryRecord[]>;
  listVehicleMakes(): Promise<VehicleMakeRecord[]>;
  listVehicleModels(makeId: string): Promise<VehicleModelRecord[]>;
  findServiceCategoryById(id: string): Promise<ServiceCategoryRecord | null>;
  findProductCategoryById(id: string): Promise<ProductCategoryRecord | null>;
}
