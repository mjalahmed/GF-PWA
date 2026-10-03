import { ValidationError } from "../../core/errors/app-error.ts";

const REPAIR_PHOTO_PHASES = new Set(["before", "during", "after"]);

export function assertRepairPhotoStoragePath(input: {
  businessId: string;
  appointmentId: string;
  phase: string;
  storagePath: string;
}): void {
  const path = input.storagePath.trim();
  if (
    !path ||
    path.includes("..") ||
    path.startsWith("/") ||
    path.includes("\\")
  ) {
    throw new ValidationError("Repair photo path is not valid.");
  }
  if (!REPAIR_PHOTO_PHASES.has(input.phase)) {
    throw new ValidationError("Repair photo phase is not valid.");
  }
  const parts = path.split("/");
  if (
    parts.length < 4 ||
    parts[0] !== input.businessId ||
    parts[1] !== input.appointmentId ||
    parts[2] !== input.phase ||
    !parts[3]
  ) {
    throw new ValidationError(
      "Repair photo path does not match this appointment.",
    );
  }
}
