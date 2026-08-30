import type { CategoryRepository } from "./category.repository.interface.ts";
import { VehicleMakeNotFoundError } from "./category.repository.ts";
import { CategoryMapper } from "./category.mapper.ts";
import type {
  ProductCategoryResponseDto,
  ServiceCategoryResponseDto,
  VehicleMakeResponseDto,
  VehicleModelResponseDto,
} from "./category.dto.ts";

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async listServiceCategories(): Promise<ServiceCategoryResponseDto[]> {
    const rows = await this.categoryRepository.listServiceCategories();
    return rows.map(CategoryMapper.toServiceCategoryDto);
  }

  async listProductCategories(): Promise<ProductCategoryResponseDto[]> {
    const rows = await this.categoryRepository.listProductCategories();
    return rows.map(CategoryMapper.toProductCategoryDto);
  }

  async listVehicleMakes(): Promise<VehicleMakeResponseDto[]> {
    const rows = await this.categoryRepository.listVehicleMakes();
    return rows.map(CategoryMapper.toVehicleMakeDto);
  }

  async listVehicleModels(makeId: string): Promise<VehicleModelResponseDto[]> {
    const makes = await this.categoryRepository.listVehicleMakes();
    if (!makes.some((m) => m.id === makeId)) {
      throw new VehicleMakeNotFoundError(makeId);
    }
    const rows = await this.categoryRepository.listVehicleModels(makeId);
    return rows.map(CategoryMapper.toVehicleModelDto);
  }
}
