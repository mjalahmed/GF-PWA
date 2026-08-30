import { z } from "npm:zod@3.24.1";
import { businessIdParamsSchema } from "./business.schemas.ts";

const uuidSchema = z.string().uuid();

export const branchParamsSchema = businessIdParamsSchema.extend({
  branchId: uuidSchema,
}).strict();
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{8,20}$/, "Enter a valid phone number");
const emailSchema = z.string().trim().email();

export const createBranchSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: phoneSchema.nullable().optional(),
  email: emailSchema.nullable().optional(),
  addressLine: z.string().trim().min(1).max(500),
  area: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  countryCode: z.string().trim().length(2).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  timezone: z.string().trim().max(64).optional(),
  isPrimary: z.boolean().optional(),
}).strict();

export const updateBranchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: phoneSchema.nullable().optional(),
  email: emailSchema.nullable().optional(),
  addressLine: z.string().trim().min(1).max(500).optional(),
  area: z.string().trim().max(120).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  countryCode: z.string().trim().length(2).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  timezone: z.string().trim().max(64).optional(),
}).strict();

export type CreateBranchRequestDto = z.infer<typeof createBranchSchema>;
export type UpdateBranchRequestDto = z.infer<typeof updateBranchSchema>;
export type BranchParamsDto = z.infer<typeof branchParamsSchema>;
