export type VehicleRecord = {
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

export type CreateVehiclePersistenceInput = {
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
  mileageUnit?: string;
  imagePath?: string | null;
};

export type UpdateVehiclePersistenceInput = Partial<CreateVehiclePersistenceInput>;
