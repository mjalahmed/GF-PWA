import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import type { ServiceRepository } from "./service.repository.interface.ts";
import type {
  CompatibilityRecord,
  CreateServiceImagePersistenceInput,
  CreateServicePersistenceInput,
  ReplaceCompatibilityInput,
  ServiceImageRecord,
  ServiceRecord,
  UpdateServicePersistenceInput,
} from "./service.types.ts";
import type { CompatibilityType, ServicePricingType } from "../../core/constants/statuses.ts";

type ServiceRow = {
  id: string;
  business_id: string;
  branch_id: string | null;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  pricing_type: ServicePricingType;
  price: number | null;
  minimum_price: number | null;
  maximum_price: number | null;
  estimated_duration_minutes: number | null;
  requires_appointment: boolean;
  requires_vehicle: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type ServiceImageRow = {
  id: string;
  service_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

type CompatibilityRow = {
  id: string;
  service_id: string;
  compatibility_type: CompatibilityType;
  make_id: string | null;
  model_id: string | null;
  minimum_year: number | null;
  maximum_year: number | null;
  created_at: string;
};

const SERVICE_SELECT =
  "id, business_id, branch_id, category_id, name, slug, description, pricing_type, price, minimum_price, maximum_price, estimated_duration_minutes, requires_appointment, requires_vehicle, is_active, metadata, created_at, updated_at";

function toService(row: ServiceRow): ServiceRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    branchId: row.branch_id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    pricingType: row.pricing_type,
    price: row.price,
    minimumPrice: row.minimum_price,
    maximumPrice: row.maximum_price,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    requiresAppointment: row.requires_appointment,
    requiresVehicle: row.requires_vehicle,
    isActive: row.is_active,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toImage(row: ServiceImageRow): ServiceImageRecord {
  return {
    id: row.id,
    serviceId: row.service_id,
    storagePath: row.storage_path,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
  };
}

function toCompatibility(row: CompatibilityRow): CompatibilityRecord {
  return {
    id: row.id,
    compatibilityType: row.compatibility_type,
    makeId: row.make_id,
    modelId: row.model_id,
    minimumYear: row.minimum_year,
    maximumYear: row.maximum_year,
    createdAt: row.created_at,
  };
}

function mapSupabaseError(error: { code?: string; message?: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "A conflicting service record already exists.",
      error,
    );
  }
  if (error.code === "23514") {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "Service data violates pricing constraints.",
      error,
    );
  }
  throw new InternalError("Database operation failed.", error);
}

export class SupabaseServiceRepository implements ServiceRepository {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async listByBusiness(
    businessId: string,
    filters?: { activeOnly?: boolean; branchId?: string; categoryId?: string },
  ): Promise<ServiceRecord[]> {
    let query = this.readClient
      .from("services")
      .select(SERVICE_SELECT)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (filters?.activeOnly) query = query.eq("is_active", true);
    if (filters?.branchId) query = query.eq("branch_id", filters.branchId);
    if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list services.", error);
    return ((data ?? []) as ServiceRow[]).map(toService);
  }

  async findById(
    businessId: string,
    serviceId: string,
  ): Promise<ServiceRecord | null> {
    const { data, error } = await this.readClient
      .from("services")
      .select(SERVICE_SELECT)
      .eq("business_id", businessId)
      .eq("id", serviceId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load service.", error);
    if (!data) return null;
    return toService(data as ServiceRow);
  }

  async create(
    businessId: string,
    input: CreateServicePersistenceInput,
  ): Promise<ServiceRecord> {
    const { data, error } = await this.adminClient
      .from("services")
      .insert({
        business_id: businessId,
        branch_id: input.branchId ?? null,
        category_id: input.categoryId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        pricing_type: input.pricingType,
        price: input.price ?? null,
        minimum_price: input.minimumPrice ?? null,
        maximum_price: input.maximumPrice ?? null,
        estimated_duration_minutes: input.estimatedDurationMinutes ?? null,
        requires_appointment: input.requiresAppointment ?? true,
        requires_vehicle: input.requiresVehicle ?? true,
        metadata: input.metadata ?? {},
        is_active: true,
      })
      .select(SERVICE_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create service.");
    return toService(data as ServiceRow);
  }

  async update(
    businessId: string,
    serviceId: string,
    input: UpdateServicePersistenceInput,
  ): Promise<ServiceRecord> {
    const patch: Record<string, unknown> = {};
    if (input.branchId !== undefined) patch.branch_id = input.branchId;
    if (input.categoryId !== undefined) patch.category_id = input.categoryId;
    if (input.name !== undefined) patch.name = input.name;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.description !== undefined) patch.description = input.description;
    if (input.pricingType !== undefined) patch.pricing_type = input.pricingType;
    if (input.price !== undefined) patch.price = input.price;
    if (input.minimumPrice !== undefined) patch.minimum_price = input.minimumPrice;
    if (input.maximumPrice !== undefined) patch.maximum_price = input.maximumPrice;
    if (input.estimatedDurationMinutes !== undefined) {
      patch.estimated_duration_minutes = input.estimatedDurationMinutes;
    }
    if (input.requiresAppointment !== undefined) {
      patch.requires_appointment = input.requiresAppointment;
    }
    if (input.requiresVehicle !== undefined) {
      patch.requires_vehicle = input.requiresVehicle;
    }
    if (input.metadata !== undefined) patch.metadata = input.metadata;

    const { data, error } = await this.adminClient
      .from("services")
      .update(patch)
      .eq("business_id", businessId)
      .eq("id", serviceId)
      .select(SERVICE_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Service was not found.");
    return toService(data as ServiceRow);
  }

  async deactivate(
    businessId: string,
    serviceId: string,
  ): Promise<{ idempotent: boolean }> {
    const existing = await this.findById(businessId, serviceId);
    if (!existing) throw new NotFoundError("Service was not found.");
    if (!existing.isActive) return { idempotent: true };

    const { error } = await this.adminClient
      .from("services")
      .update({ is_active: false })
      .eq("business_id", businessId)
      .eq("id", serviceId);

    if (error) mapSupabaseError(error);
    return { idempotent: false };
  }

  async listImages(serviceId: string): Promise<ServiceImageRecord[]> {
    const { data, error } = await this.readClient
      .from("service_images")
      .select(
        "id, service_id, storage_path, alt_text, sort_order, is_primary, created_at",
      )
      .eq("service_id", serviceId)
      .order("sort_order");

    if (error) throw new InternalError("Failed to list service images.", error);
    return ((data ?? []) as ServiceImageRow[]).map(toImage);
  }

  async createImage(
    input: CreateServiceImagePersistenceInput,
  ): Promise<ServiceImageRecord> {
    if (input.isPrimary) {
      await this.adminClient
        .from("service_images")
        .update({ is_primary: false })
        .eq("service_id", input.serviceId);
    }

    const { data, error } = await this.adminClient
      .from("service_images")
      .insert({
        id: input.id,
        service_id: input.serviceId,
        storage_path: input.storagePath,
        alt_text: input.altText ?? null,
        sort_order: input.sortOrder ?? 0,
        is_primary: input.isPrimary ?? false,
      })
      .select(
        "id, service_id, storage_path, alt_text, sort_order, is_primary, created_at",
      )
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create service image.");
    return toImage(data as ServiceImageRow);
  }

  async deleteImage(serviceId: string, imageId: string): Promise<void> {
    const { data, error } = await this.adminClient
      .from("service_images")
      .delete()
      .eq("service_id", serviceId)
      .eq("id", imageId)
      .select("storage_path")
      .maybeSingle();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Service image was not found.");

    await this.adminClient.storage
      .from("service-images")
      .remove([(data as { storage_path: string }).storage_path]);
  }

  async listCompatibility(serviceId: string): Promise<CompatibilityRecord[]> {
    const { data, error } = await this.readClient
      .from("service_vehicle_compatibility")
      .select(
        "id, service_id, compatibility_type, make_id, model_id, minimum_year, maximum_year, created_at",
      )
      .eq("service_id", serviceId)
      .order("created_at");

    if (error) {
      throw new InternalError("Failed to list service compatibility.", error);
    }
    return ((data ?? []) as CompatibilityRow[]).map(toCompatibility);
  }

  async replaceCompatibility(
    serviceId: string,
    items: ReplaceCompatibilityInput[],
  ): Promise<CompatibilityRecord[]> {
    const { error: deleteError } = await this.adminClient
      .from("service_vehicle_compatibility")
      .delete()
      .eq("service_id", serviceId);

    if (deleteError) {
      throw new InternalError("Failed to replace compatibility.", deleteError);
    }

    if (items.length === 0) return [];

    const rows = items.map((item) => ({
      service_id: serviceId,
      compatibility_type: item.compatibilityType,
      make_id: item.makeId ?? null,
      model_id: item.modelId ?? null,
      minimum_year: item.minimumYear ?? null,
      maximum_year: item.maximumYear ?? null,
    }));

    const { data, error } = await this.adminClient
      .from("service_vehicle_compatibility")
      .insert(rows)
      .select(
        "id, service_id, compatibility_type, make_id, model_id, minimum_year, maximum_year, created_at",
      );

    if (error) mapSupabaseError(error);
    return ((data ?? []) as CompatibilityRow[]).map(toCompatibility);
  }
}
