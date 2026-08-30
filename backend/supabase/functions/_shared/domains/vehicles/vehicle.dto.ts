export type VehicleResponseDto = {
  id: string;
  customerId: string;
  makeId: string | null;
  modelId: string | null;
  makeText: string | null;
  modelText: string | null;
  year: number;
  trim: string | null;
  engine: string | null;
  vin: string | null;
  registrationNumber: string | null;
  color: string | null;
  mileage: number | null;
  mileageUnit: string;
  imagePath: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateVehicleRequestDto = {
  makeId?: string | null;
  modelId?: string | null;
  makeText?: string | null;
  modelText?: string | null;
  year: number;
  trim?: string | null;
  engine?: string | null;
  vin?: string | null;
  registrationNumber?: string | null;
  color?: string | null;
  mileage?: number | null;
  mileageUnit?: "km" | "mi";
  imagePath?: string | null;
};

export type UpdateVehicleRequestDto = Partial<CreateVehicleRequestDto>;

export type DeactivateVehicleResponseDto = {
  vehicleId: string;
  idempotent: boolean;
};

export type MakeVehicleDefaultResponseDto = {
  vehicleId: string;
};
