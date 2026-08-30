import { z } from "npm:zod@3.24.1";
import { AppointmentStatuses } from "../../core/constants/statuses.ts";

const uuid = z.string().uuid();
const isoDateTime = z.string().datetime({ offset: true });

export const createAppointmentSchema = z.object({
  businessId: uuid,
  branchId: uuid,
  serviceId: uuid,
  vehicleId: uuid.nullable().optional(),
  scheduledStart: isoDateTime,
  customerNotes: z.string().max(2000).nullable().optional(),
}).strict();

export const transitionBodySchema = z.object({
  note: z.string().max(2000).nullable().optional(),
  reason: z.string().max(2000).nullable().optional(),
}).strict();

export const appointmentIdParamsSchema = z.object({
  appointmentId: uuid,
}).strict();

export const businessIdParamsSchema = z.object({
  businessId: uuid,
}).strict();

export const branchSlotsParamsSchema = z.object({
  businessId: uuid,
  branchId: uuid,
}).strict();

export const listAppointmentsQuerySchema = z.object({
  status: z
    .union([
      z.enum(Object.values(AppointmentStatuses) as [string, ...string[]]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  businessId: uuid.optional(),
  branchId: uuid.optional(),
}).strict();

export const listBusinessAppointmentsQuerySchema = z.object({
  status: z
    .union([
      z.enum(Object.values(AppointmentStatuses) as [string, ...string[]]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  branchId: uuid.optional(),
}).strict();

export const appointmentSlotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: uuid.optional(),
}).strict();

export type CreateAppointmentRequestDto = z.infer<typeof createAppointmentSchema>;
export type TransitionBodyDto = z.infer<typeof transitionBodySchema>;
export type AppointmentIdParamsDto = z.infer<typeof appointmentIdParamsSchema>;
export type BusinessIdParamsDto = z.infer<typeof businessIdParamsSchema>;
export type BranchSlotsParamsDto = z.infer<typeof branchSlotsParamsSchema>;
export type ListAppointmentsQueryDto = z.infer<typeof listAppointmentsQuerySchema>;
export type ListBusinessAppointmentsQueryDto = z.infer<
  typeof listBusinessAppointmentsQuerySchema
>;
export type AppointmentSlotsQueryDto = z.infer<typeof appointmentSlotsQuerySchema>;
