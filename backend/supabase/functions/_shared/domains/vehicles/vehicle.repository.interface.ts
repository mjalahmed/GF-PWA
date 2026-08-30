import type {
  CreateVehiclePersistenceInput,
  UpdateVehiclePersistenceInput,
  VehicleRecord,
} from "./vehicle.types.ts";

export interface VehicleRepository {
  listByCustomer(customerId: string, activeOnly?: boolean): Promise<VehicleRecord[]>;
  findById(vehicleId: string): Promise<VehicleRecord | null>;
  create(customerId: string, input: CreateVehiclePersistenceInput): Promise<VehicleRecord>;
  update(
    vehicleId: string,
    customerId: string,
    input: UpdateVehiclePersistenceInput,
  ): Promise<VehicleRecord>;
  deactivate(vehicleId: string, customerId: string): Promise<{ idempotent: boolean }>;
  makeDefaultViaRpc(vehicleId: string, customerId: string): Promise<{ vehicleId: string }>;
}
