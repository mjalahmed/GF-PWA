import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type {
  CreateVehicleRequestDto,
  UpdateVehicleRequestDto,
  VehicleIdParamsDto,
} from "./vehicle.schemas.ts";

export async function listVehiclesController(c: AppContext) {
  const customerId = c.get("userId")!;
  const { vehicleService } = createRequestDependencies(c);
  const vehicles = await vehicleService.list(customerId);
  return successResponse(c, vehicles);
}

export async function createVehicleController(c: AppContext) {
  const actorId = c.get("userId")!;
  const body = (c.get("validatedBody" as never) ?? {}) as CreateVehicleRequestDto;
  const { vehicleService } = createRequestDependencies(c);
  const vehicle = await vehicleService.create(actorId, body, c.get("requestId"));
  return successResponse(c, vehicle, 201);
}

export async function getVehicleController(c: AppContext) {
  const customerId = c.get("userId")!;
  const { vehicleId } = (c.get("validatedParams" as never) ??
    {}) as VehicleIdParamsDto;
  const { vehicleService } = createRequestDependencies(c);
  const vehicle = await vehicleService.getById(customerId, vehicleId);
  return successResponse(c, vehicle);
}

export async function updateVehicleController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { vehicleId } = (c.get("validatedParams" as never) ??
    {}) as VehicleIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as UpdateVehicleRequestDto;
  const { vehicleService } = createRequestDependencies(c);
  const vehicle = await vehicleService.update(
    actorId,
    vehicleId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, vehicle);
}

export async function deactivateVehicleController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { vehicleId } = (c.get("validatedParams" as never) ??
    {}) as VehicleIdParamsDto;
  const { vehicleService } = createRequestDependencies(c);
  const result = await vehicleService.deactivate(
    actorId,
    vehicleId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function makeVehicleDefaultController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { vehicleId } = (c.get("validatedParams" as never) ??
    {}) as VehicleIdParamsDto;
  const { vehicleService } = createRequestDependencies(c);
  const result = await vehicleService.makeDefault(
    actorId,
    vehicleId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}
