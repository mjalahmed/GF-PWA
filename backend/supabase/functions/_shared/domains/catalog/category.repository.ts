import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError, NotFoundError } from "../../core/errors/app-error.ts";
import type { CategoryRepository } from "./category.repository.interface.ts";
import type {
  ProductCategoryRecord,
  ServiceCategoryRecord,
  VehicleMakeRecord,
  VehicleModelRecord,
} from "./category.types.ts";

type ServiceCategoryRow = {
  id: string;
  parent_id: string | null;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type VehicleMakeRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
};

type VehicleModelRow = {
  id: string;
  make_id: string;
  name: string;
  slug: string;
  start_year: number | null;
  end_year: number | null;
  is_active: boolean;
  created_at: string;
};

const SERVICE_CATEGORY_SELECT =
  "id, parent_id, code, name, description, icon, is_active, sort_order, created_at, updated_at";

function toServiceCategory(row: ServiceCategoryRow): ServiceCategoryRecord {
  return {
    id: row.id,
    parentId: row.parent_id,
    code: row.code,
    name: row.name,
    description: row.description,
    icon: row.icon,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProductCategory(row: ServiceCategoryRow): ProductCategoryRecord {
  return toServiceCategory(row) as ProductCategoryRecord;
}

function toVehicleMake(row: VehicleMakeRow): VehicleMakeRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function toVehicleModel(row: VehicleModelRow): VehicleModelRecord {
  return {
    id: row.id,
    makeId: row.make_id,
    name: row.name,
    slug: row.slug,
    startYear: row.start_year,
    endYear: row.end_year,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export class SupabaseCategoryRepository implements CategoryRepository {
  constructor(private readonly readClient: SupabaseClient) {}

  async listServiceCategories(): Promise<ServiceCategoryRecord[]> {
    const { data, error } = await this.readClient
      .from("service_categories")
      .select(SERVICE_CATEGORY_SELECT)
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw new InternalError("Failed to list service categories.", error);
    return ((data ?? []) as ServiceCategoryRow[]).map(toServiceCategory);
  }

  async listProductCategories(): Promise<ProductCategoryRecord[]> {
    const { data, error } = await this.readClient
      .from("product_categories")
      .select(SERVICE_CATEGORY_SELECT)
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw new InternalError("Failed to list product categories.", error);
    return ((data ?? []) as ServiceCategoryRow[]).map(toProductCategory);
  }

  async listVehicleMakes(): Promise<VehicleMakeRecord[]> {
    const { data, error } = await this.readClient
      .from("vehicle_makes")
      .select("id, name, slug, is_active, created_at")
      .eq("is_active", true)
      .order("name");

    if (error) throw new InternalError("Failed to list vehicle makes.", error);
    return ((data ?? []) as VehicleMakeRow[]).map(toVehicleMake);
  }

  async listVehicleModels(makeId: string): Promise<VehicleModelRecord[]> {
    const { data, error } = await this.readClient
      .from("vehicle_models")
      .select(
        "id, make_id, name, slug, start_year, end_year, is_active, created_at",
      )
      .eq("make_id", makeId)
      .eq("is_active", true)
      .order("name");

    if (error) throw new InternalError("Failed to list vehicle models.", error);
    return ((data ?? []) as VehicleModelRow[]).map(toVehicleModel);
  }

  async findServiceCategoryById(id: string): Promise<ServiceCategoryRecord | null> {
    const { data, error } = await this.readClient
      .from("service_categories")
      .select(SERVICE_CATEGORY_SELECT)
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load service category.", error);
    if (!data) return null;
    return toServiceCategory(data as ServiceCategoryRow);
  }

  async findProductCategoryById(id: string): Promise<ProductCategoryRecord | null> {
    const { data, error } = await this.readClient
      .from("product_categories")
      .select(SERVICE_CATEGORY_SELECT)
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load product category.", error);
    if (!data) return null;
    return toProductCategory(data as ServiceCategoryRow);
  }
}

export class VehicleMakeNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Vehicle make was not found.", id ? { makeId: id } : null);
    this.name = "VehicleMakeNotFoundError";
  }
}
