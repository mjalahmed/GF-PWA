import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";

export class VehicleNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Vehicle was not found.", id ? { vehicleId: id } : null);
    this.name = "VehicleNotFoundError";
  }
}

export class VehicleAccessDeniedError extends AuthorizationError {
  constructor() {
    super("You do not have access to this vehicle.");
    this.name = "VehicleAccessDeniedError";
  }
}

export function mapVehicleRpcError(message: string): never {
  if (message.includes("VEHICLE_NOT_FOUND")) {
    throw new VehicleNotFoundError();
  }
  if (message.includes("VEHICLE_ACCESS_DENIED")) {
    throw new VehicleAccessDeniedError();
  }
  if (message.includes("VEHICLE_INACTIVE")) {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "Vehicle is inactive.",
    );
  }
  throw new ConflictError(ErrorCodes.Resource.Conflict, message);
}

export function normalizeVin(vin: string | null | undefined): string | null {
  if (!vin) return null;
  return vin.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeRegistration(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  return value.trim().toUpperCase().replace(/\s+/g, "");
}
