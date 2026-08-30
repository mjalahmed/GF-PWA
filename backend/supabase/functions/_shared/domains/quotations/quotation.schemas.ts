import { z } from "npm:zod@3.24.1";
import {
  QuotationItemTypes,
  QuotationStatuses,
} from "../../core/constants/statuses.ts";

const uuid = z.string().uuid();
const isoDateTime = z.string().datetime({ offset: true });
const money = z.union([z.number(), z.string()]);

const quotationItemTypeValues = [
  QuotationItemTypes.Service,
  QuotationItemTypes.Product,
  QuotationItemTypes.Labor,
  QuotationItemTypes.Custom,
] as const;

const quotationItemInputSchema = z.object({
  itemType: z.enum(quotationItemTypeValues),
  serviceId: uuid.nullable().optional(),
  productId: uuid.nullable().optional(),
  description: z.string().min(1).max(2000),
  quantity: money,
  unitPrice: money,
  discountAmount: money.optional(),
  taxAmount: money.optional(),
  sortOrder: z.number().int().min(0).optional(),
}).strict();

export const createQuotationSchema = z.object({
  customerId: uuid,
  branchId: uuid,
  vehicleId: uuid.nullable().optional(),
  appointmentId: uuid.nullable().optional(),
  validUntil: isoDateTime.nullable().optional(),
  customerMessage: z.string().max(5000).nullable().optional(),
  businessNotes: z.string().max(5000).nullable().optional(),
  items: z.array(quotationItemInputSchema).min(1),
}).strict();

export const createFromAppointmentSchema = z.object({
  vehicleId: uuid.nullable().optional(),
  validUntil: isoDateTime.nullable().optional(),
  customerMessage: z.string().max(5000).nullable().optional(),
  businessNotes: z.string().max(5000).nullable().optional(),
  items: z.array(quotationItemInputSchema).min(1).optional(),
}).strict();

export const updateQuotationSchema = z.object({
  branchId: uuid.optional(),
  vehicleId: uuid.nullable().optional(),
  appointmentId: uuid.nullable().optional(),
  validUntil: isoDateTime.nullable().optional(),
  customerMessage: z.string().max(5000).nullable().optional(),
  businessNotes: z.string().max(5000).nullable().optional(),
  items: z.array(quotationItemInputSchema).min(1),
}).strict();

export const transitionBodySchema = z.object({
  note: z.string().max(2000).nullable().optional(),
}).strict();

export const quotationIdParamsSchema = z.object({
  quotationId: uuid,
}).strict();

export const businessIdParamsSchema = z.object({
  businessId: uuid,
}).strict();

export const businessQuotationParamsSchema = z.object({
  businessId: uuid,
  quotationId: uuid,
}).strict();

export const appointmentQuotationParamsSchema = z.object({
  businessId: uuid,
  appointmentId: uuid,
}).strict();

export const listQuotationsQuerySchema = z.object({
  status: z
    .union([
      z.enum(Object.values(QuotationStatuses) as [string, ...string[]]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  businessId: uuid.optional(),
}).strict();

export const listBusinessQuotationsQuerySchema = z.object({
  status: z
    .union([
      z.enum(Object.values(QuotationStatuses) as [string, ...string[]]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  customerId: uuid.optional(),
}).strict();

export type CreateQuotationRequestDto = z.infer<typeof createQuotationSchema>;
export type CreateFromAppointmentRequestDto = z.infer<
  typeof createFromAppointmentSchema
>;
export type UpdateQuotationRequestDto = z.infer<typeof updateQuotationSchema>;
export type TransitionBodyDto = z.infer<typeof transitionBodySchema>;
export type QuotationIdParamsDto = z.infer<typeof quotationIdParamsSchema>;
export type BusinessIdParamsDto = z.infer<typeof businessIdParamsSchema>;
export type BusinessQuotationParamsDto = z.infer<typeof businessQuotationParamsSchema>;
export type AppointmentQuotationParamsDto = z.infer<
  typeof appointmentQuotationParamsSchema
>;
export type ListQuotationsQueryDto = z.infer<typeof listQuotationsQuerySchema>;
export type ListBusinessQuotationsQueryDto = z.infer<
  typeof listBusinessQuotationsQuerySchema
>;
