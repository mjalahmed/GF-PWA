import { z } from "npm:zod@3.24.1";

const uuidSchema = z.string().uuid();
const currentYear = new Date().getFullYear();

export const vehicleIdParamsSchema = z.object({
  vehicleId: uuidSchema,
}).strict();

const vehicleFieldsSchema = z.object({
  makeId: uuidSchema.nullable().optional(),
  modelId: uuidSchema.nullable().optional(),
  makeText: z.string().trim().min(1).max(120).nullable().optional(),
  modelText: z.string().trim().min(1).max(120).nullable().optional(),
  year: z.number().int().min(1950).max(currentYear + 1),
  trim: z.string().trim().max(120).nullable().optional(),
  engine: z.string().trim().max(120).nullable().optional(),
  vin: z.string().trim().max(17).nullable().optional(),
  registrationNumber: z.string().trim().max(40).nullable().optional(),
  color: z.string().trim().max(60).nullable().optional(),
  mileage: z.number().int().min(0).nullable().optional(),
  mileageUnit: z.enum(["km", "mi"]).optional(),
  imagePath: z.string().trim().max(500).nullable().optional(),
}).strict();

export const createVehicleSchema = vehicleFieldsSchema.refine(
  (v) => v.makeId || (v.makeText && v.makeText.length > 0),
  { message: "Either makeId or makeText is required." },
);

export const updateVehicleSchema = vehicleFieldsSchema.partial().strict();

export type VehicleIdParamsDto = z.infer<typeof vehicleIdParamsSchema>;
export type CreateVehicleRequestDto = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleRequestDto = z.infer<typeof updateVehicleSchema>;
