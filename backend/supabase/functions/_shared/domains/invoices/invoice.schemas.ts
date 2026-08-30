import { z } from "npm:zod@3.24.1";
import {
  InvoiceItemTypes,
  InvoiceStatuses,
  PaymentMethods,
} from "../../core/constants/statuses.ts";

const uuid = z.string().uuid();
const isoDateTime = z.string().datetime({ offset: true });
const money = z.union([z.number(), z.string()]);

const invoiceItemTypeValues = [
  InvoiceItemTypes.Service,
  InvoiceItemTypes.Product,
  InvoiceItemTypes.Labor,
  InvoiceItemTypes.Custom,
] as const;

const invoiceItemInputSchema = z.object({
  itemType: z.enum(invoiceItemTypeValues),
  serviceId: uuid.nullable().optional(),
  productId: uuid.nullable().optional(),
  description: z.string().min(1).max(2000),
  quantity: money,
  unitPrice: money,
  discountAmount: money.optional(),
  taxAmount: money.optional(),
  sortOrder: z.number().int().min(0).optional(),
}).strict();

export const createInvoiceSchema = z.object({
  customerId: uuid,
  branchId: uuid,
  vehicleId: uuid.nullable().optional(),
  appointmentId: uuid.nullable().optional(),
  quotationId: uuid.nullable().optional(),
  requiresCustomerApproval: z.boolean().optional(),
  dueAt: isoDateTime.nullable().optional(),
  customerMessage: z.string().max(5000).nullable().optional(),
  businessNotes: z.string().max(5000).nullable().optional(),
  items: z.array(invoiceItemInputSchema).min(1),
}).strict();

export const createFromAppointmentSchema = z.object({
  vehicleId: uuid.nullable().optional(),
  requiresCustomerApproval: z.boolean().optional(),
  dueAt: isoDateTime.nullable().optional(),
  customerMessage: z.string().max(5000).nullable().optional(),
  businessNotes: z.string().max(5000).nullable().optional(),
  items: z.array(invoiceItemInputSchema).min(1).optional(),
}).strict();

export const createFromQuotationSchema = z.object({
  requiresCustomerApproval: z.boolean().optional(),
  dueAt: isoDateTime.nullable().optional(),
  customerMessage: z.string().max(5000).nullable().optional(),
  businessNotes: z.string().max(5000).nullable().optional(),
}).strict();

export const updateInvoiceSchema = z.object({
  branchId: uuid.optional(),
  vehicleId: uuid.nullable().optional(),
  appointmentId: uuid.nullable().optional(),
  requiresCustomerApproval: z.boolean().optional(),
  dueAt: isoDateTime.nullable().optional(),
  customerMessage: z.string().max(5000).nullable().optional(),
  businessNotes: z.string().max(5000).nullable().optional(),
  items: z.array(invoiceItemInputSchema).min(1),
}).strict();

export const transitionBodySchema = z.object({
  note: z.string().max(2000).nullable().optional(),
}).strict();

export const recordCashPaymentSchema = z.object({
  amount: money,
}).strict();

export const invoiceIdParamsSchema = z.object({
  invoiceId: uuid,
}).strict();

export const paymentIdParamsSchema = z.object({
  paymentId: uuid,
}).strict();

export const businessIdParamsSchema = z.object({
  businessId: uuid,
}).strict();

export const businessInvoiceParamsSchema = z.object({
  businessId: uuid,
  invoiceId: uuid,
}).strict();

export const quotationInvoiceParamsSchema = z.object({
  businessId: uuid,
  quotationId: uuid,
}).strict();

export const appointmentInvoiceParamsSchema = z.object({
  businessId: uuid,
  appointmentId: uuid,
}).strict();

export const listInvoicesQuerySchema = z.object({
  status: z
    .union([
      z.enum(Object.values(InvoiceStatuses) as [string, ...string[]]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  businessId: uuid.optional(),
}).strict();

export const listBusinessInvoicesQuerySchema = z.object({
  status: z
    .union([
      z.enum(Object.values(InvoiceStatuses) as [string, ...string[]]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  customerId: uuid.optional(),
}).strict();

export const listPaymentsQuerySchema = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  invoiceId: uuid.optional(),
}).strict();

export const listBusinessPaymentsQuerySchema = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  invoiceId: uuid.optional(),
  customerId: uuid.optional(),
}).strict();

export type CreateInvoiceRequestDto = z.infer<typeof createInvoiceSchema>;
export type CreateFromAppointmentRequestDto = z.infer<
  typeof createFromAppointmentSchema
>;
export type CreateFromQuotationRequestDto = z.infer<
  typeof createFromQuotationSchema
>;
export type UpdateInvoiceRequestDto = z.infer<typeof updateInvoiceSchema>;
export type TransitionBodyDto = z.infer<typeof transitionBodySchema>;
export type RecordCashPaymentRequestDto = z.infer<typeof recordCashPaymentSchema>;
export type InvoiceIdParamsDto = z.infer<typeof invoiceIdParamsSchema>;
export type PaymentIdParamsDto = z.infer<typeof paymentIdParamsSchema>;
export type BusinessIdParamsDto = z.infer<typeof businessIdParamsSchema>;
export type BusinessInvoiceParamsDto = z.infer<typeof businessInvoiceParamsSchema>;
export type QuotationInvoiceParamsDto = z.infer<typeof quotationInvoiceParamsSchema>;
export type AppointmentInvoiceParamsDto = z.infer<
  typeof appointmentInvoiceParamsSchema
>;
export type ListInvoicesQueryDto = z.infer<typeof listInvoicesQuerySchema>;
export type ListBusinessInvoicesQueryDto = z.infer<
  typeof listBusinessInvoicesQuerySchema
>;
export type ListPaymentsQueryDto = z.infer<typeof listPaymentsQuerySchema>;
export type ListBusinessPaymentsQueryDto = z.infer<
  typeof listBusinessPaymentsQuerySchema
>;

/** Ensures only enabled methods are accepted at the schema layer. */
export const enabledPaymentMethodValues = [
  PaymentMethods.Cash,
] as const;
