import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { VehicleRepository } from "./vehicle.repository.interface.ts";
import {
  VehicleAccessDeniedError,
  VehicleNotFoundError,
  normalizeRegistration,
  normalizeVin,
} from "./vehicle.errors.ts";
import { VehicleMapper } from "./vehicle.mapper.ts";
import type {
  CreateVehicleRequestDto,
  DeactivateVehicleResponseDto,
  MakeVehicleDefaultResponseDto,
  UpdateVehicleRequestDto,
  VehicleResponseDto,
} from "./vehicle.dto.ts";

export class VehicleService {
  constructor(
    private readonly vehicleRepository: VehicleRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  private assertOwnership(record: { customerId: string }, customerId: string) {
    if (record.customerId !== customerId) throw new VehicleAccessDeniedError();
  }

  async list(customerId: string): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehicleRepository.listByCustomer(customerId);
    return vehicles.map(VehicleMapper.toDto);
  }

  async getById(
    customerId: string,
    vehicleId: string,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) throw new VehicleNotFoundError(vehicleId);
    this.assertOwnership(vehicle, customerId);
    return VehicleMapper.toDto(vehicle);
  }

  async create(
    actorUserId: string,
    input: CreateVehicleRequestDto,
    requestId?: string,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.create(actorUserId, {
      makeId: input.makeId ?? null,
      modelId: input.modelId ?? null,
      makeText: input.makeText ?? null,
      modelText: input.modelText ?? null,
      year: input.year,
      trim: input.trim ?? null,
      engine: input.engine ?? null,
      vin: normalizeVin(input.vin),
      registrationNumber: normalizeRegistration(input.registrationNumber),
      color: input.color ?? null,
      mileage: input.mileage ?? null,
      mileageUnit: input.mileageUnit ?? "km",
      imagePath: input.imagePath ?? null,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "vehicle.created",
      entityType: "vehicle",
      entityId: vehicle.id,
      requestId,
    });

    return VehicleMapper.toDto(vehicle);
  }

  async update(
    actorUserId: string,
    vehicleId: string,
    input: UpdateVehicleRequestDto,
    requestId?: string,
  ): Promise<VehicleResponseDto> {
    const existing = await this.vehicleRepository.findById(vehicleId);
    if (!existing) throw new VehicleNotFoundError(vehicleId);
    this.assertOwnership(existing, actorUserId);

    const updated = await this.vehicleRepository.update(vehicleId, actorUserId, {
      ...input,
      vin: input.vin !== undefined ? normalizeVin(input.vin) : undefined,
      registrationNumber: input.registrationNumber !== undefined
        ? normalizeRegistration(input.registrationNumber)
        : undefined,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "vehicle.updated",
      entityType: "vehicle",
      entityId: vehicleId,
      requestId,
    });

    return VehicleMapper.toDto(updated);
  }

  async deactivate(
    actorUserId: string,
    vehicleId: string,
    requestId?: string,
  ): Promise<DeactivateVehicleResponseDto> {
    const existing = await this.vehicleRepository.findById(vehicleId);
    if (!existing) throw new VehicleNotFoundError(vehicleId);
    this.assertOwnership(existing, actorUserId);

    const result = await this.vehicleRepository.deactivate(vehicleId, actorUserId);

    if (!result.idempotent) {
      await this.auditRepository.write({
        actorUserId,
        action: "vehicle.deactivated",
        entityType: "vehicle",
        entityId: vehicleId,
        requestId,
      });
    }

    return { vehicleId, idempotent: result.idempotent };
  }

  async makeDefault(
    actorUserId: string,
    vehicleId: string,
    requestId?: string,
  ): Promise<MakeVehicleDefaultResponseDto> {
    const existing = await this.vehicleRepository.findById(vehicleId);
    if (!existing) throw new VehicleNotFoundError(vehicleId);
    this.assertOwnership(existing, actorUserId);

    const result = await this.vehicleRepository.makeDefaultViaRpc(
      vehicleId,
      actorUserId,
    );

    await this.auditRepository.write({
      actorUserId,
      action: "vehicle.default_changed",
      entityType: "vehicle",
      entityId: vehicleId,
      requestId,
    });

    return result;
  }
}
