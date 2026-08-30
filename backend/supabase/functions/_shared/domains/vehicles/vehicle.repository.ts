import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import type { VehicleRepository } from "./vehicle.repository.interface.ts";
import type {
  CreateVehiclePersistenceInput,
  UpdateVehiclePersistenceInput,
  VehicleRecord,
} from "./vehicle.types.ts";
import { mapVehicleRpcError } from "./vehicle.errors.ts";

type VehicleRow = {
  id: string;
  customer_id: string;
  make_id: string | null;
  model_id: string | null;
  make_text: string | null;
  model_text: string | null;
  year: number;
  trim: string | null;
  engine: string | null;
  vin: string | null;
  registration_number: string | null;
  color: string | null;
  mileage: number | null;
  mileage_unit: string;
  image_path: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const VEHICLE_SELECT =
  "id, customer_id, make_id, model_id, make_text, model_text, year, trim, engine, vin, registration_number, color, mileage, mileage_unit, image_path, is_default, is_active, created_at, updated_at";

function toVehicle(row: VehicleRow): VehicleRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    makeId: row.make_id,
    modelId: row.model_id,
    makeText: row.make_text,
    modelText: row.model_text,
    year: row.year,
    trim: row.trim,
    engine: row.engine,
    vin: row.vin,
    registrationNumber: row.registration_number,
    color: row.color,
    mileage: row.mileage,
    mileageUnit: row.mileage_unit,
    imagePath: row.image_path,
    isDefault: row.is_default,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseError(error: { code?: string; message?: string }): never {
  if (error.code === "23514") {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "Vehicle data violates constraints.",
      error,
    );
  }
  throw new InternalError("Database operation failed.", error);
}

export class SupabaseVehicleRepository implements VehicleRepository {
  constructor(
    private readonly userClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async listByCustomer(
    customerId: string,
    activeOnly = true,
  ): Promise<VehicleRecord[]> {
    let query = this.userClient
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .eq("customer_id", customerId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (activeOnly) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list vehicles.", error);
    return ((data ?? []) as VehicleRow[]).map(toVehicle);
  }

  async findById(vehicleId: string): Promise<VehicleRecord | null> {
    const { data, error } = await this.userClient
      .from("vehicles")
      .select(VEHICLE_SELECT)
      .eq("id", vehicleId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load vehicle.", error);
    if (!data) return null;
    return toVehicle(data as VehicleRow);
  }

  async create(
    customerId: string,
    input: CreateVehiclePersistenceInput,
  ): Promise<VehicleRecord> {
    const { data, error } = await this.userClient
      .from("vehicles")
      .insert({
        customer_id: customerId,
        make_id: input.makeId ?? null,
        model_id: input.modelId ?? null,
        make_text: input.makeText ?? null,
        model_text: input.modelText ?? null,
        year: input.year,
        trim: input.trim ?? null,
        engine: input.engine ?? null,
        vin: input.vin ?? null,
        registration_number: input.registrationNumber ?? null,
        color: input.color ?? null,
        mileage: input.mileage ?? null,
        mileage_unit: input.mileageUnit ?? "km",
        image_path: input.imagePath ?? null,
        is_active: true,
      })
      .select(VEHICLE_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create vehicle.");
    return toVehicle(data as VehicleRow);
  }

  async update(
    vehicleId: string,
    customerId: string,
    input: UpdateVehiclePersistenceInput,
  ): Promise<VehicleRecord> {
    const patch: Record<string, unknown> = {};
    if (input.makeId !== undefined) patch.make_id = input.makeId;
    if (input.modelId !== undefined) patch.model_id = input.modelId;
    if (input.makeText !== undefined) patch.make_text = input.makeText;
    if (input.modelText !== undefined) patch.model_text = input.modelText;
    if (input.year !== undefined) patch.year = input.year;
    if (input.trim !== undefined) patch.trim = input.trim;
    if (input.engine !== undefined) patch.engine = input.engine;
    if (input.vin !== undefined) patch.vin = input.vin;
    if (input.registrationNumber !== undefined) {
      patch.registration_number = input.registrationNumber;
    }
    if (input.color !== undefined) patch.color = input.color;
    if (input.mileage !== undefined) patch.mileage = input.mileage;
    if (input.mileageUnit !== undefined) patch.mileage_unit = input.mileageUnit;
    if (input.imagePath !== undefined) patch.image_path = input.imagePath;

    const { data, error } = await this.userClient
      .from("vehicles")
      .update(patch)
      .eq("id", vehicleId)
      .eq("customer_id", customerId)
      .select(VEHICLE_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Vehicle was not found.");
    return toVehicle(data as VehicleRow);
  }

  async deactivate(
    vehicleId: string,
    customerId: string,
  ): Promise<{ idempotent: boolean }> {
    const existing = await this.findById(vehicleId);
    if (!existing || existing.customerId !== customerId) {
      throw new NotFoundError("Vehicle was not found.");
    }
    if (!existing.isActive) return { idempotent: true };

    const { error } = await this.userClient
      .from("vehicles")
      .update({ is_active: false, is_default: false })
      .eq("id", vehicleId)
      .eq("customer_id", customerId);

    if (error) mapSupabaseError(error);
    return { idempotent: false };
  }

  async makeDefaultViaRpc(
    vehicleId: string,
    customerId: string,
  ): Promise<{ vehicleId: string }> {
    const { data, error } = await this.adminClient.rpc("make_vehicle_default", {
      p_vehicle_id: vehicleId,
      p_customer_id: customerId,
    });

    if (error) mapVehicleRpcError(error.message ?? "Default vehicle change failed.");
    const result = data as { vehicleId: string };
    return { vehicleId: result.vehicleId };
  }
}
