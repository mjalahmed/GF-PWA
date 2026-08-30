import { z } from "npm:zod@3.24.1";
import {
  DisputeReasonCodes,
  DisputeResolutionCodes,
  DisputeStatuses,
} from "../../core/constants/statuses.ts";
import { paginationQuerySchema } from "../../core/validation/common.schemas.ts";

const uuid = z.string().uuid();

const disputeSourceFields = {
  appointmentId: uuid.nullable().optional(),
  quotationId: uuid.nullable().optional(),
  invoiceId: uuid.nullable().optional(),
  paymentId: uuid.nullable().optional(),
  reviewId: uuid.nullable().optional(),
};

const reasonCodeSchema = z.enum(
  Object.values(DisputeReasonCodes) as [string, ...string[]],
);

const resolutionCodeSchema = z.enum(
  Object.values(DisputeResolutionCodes) as [string, ...string[]],
);

export const createCustomerDisputeSchema = z.object({
  businessId: uuid,
  ...disputeSourceFields,
  reasonCode: reasonCodeSchema,
  summary: z.string().min(1).max(500),
  description: z.string().max(5000).nullable().optional(),
  initialMessage: z.string().min(1).max(5000).nullable().optional(),
}).strict();

export const createBusinessDisputeSchema = createCustomerDisputeSchema.extend({
  customerId: uuid,
}).strict();

export const disputeMessageSchema = z.object({
  message: z.string().min(1).max(5000),
}).strict();

export const disputeEvidenceSchema = z.object({
  originalFileName: z.string().min(1).max(255),
  mimeType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
  fileSizeBytes: z.number().int().positive().max(10_485_760),
  description: z.string().max(1000).nullable().optional(),
}).strict();

export const disputeAssignSchema = z.object({
  assignedAdminId: uuid,
}).strict();

export const disputeResolveSchema = z.object({
  resolutionCode: resolutionCodeSchema,
  resolutionSummary: z.string().min(1).max(5000),
  reason: z.string().max(2000).nullable().optional(),
}).strict();

export const disputeRejectSchema = z.object({
  reason: z.string().min(1).max(2000),
}).strict();

export const disputeCloseSchema = z.object({
  reason: z.string().max(2000).nullable().optional(),
}).strict();

export const disputeInternalMessageSchema = z.object({
  message: z.string().min(1).max(5000),
}).strict();

export const disputeTransitionBodySchema = z.object({
  reason: z.string().max(2000).nullable().optional(),
}).strict();

export const disputeIdParamsSchema = z.object({
  disputeId: uuid,
}).strict();

export const businessDisputeParamsSchema = z.object({
  businessId: uuid,
  disputeId: uuid,
}).strict();

export const businessIdParamsSchema = z.object({
  businessId: uuid,
}).strict();

export const listDisputesQuerySchema = paginationQuerySchema.extend({
  status: z
    .union([
      z.enum(Object.values(DisputeStatuses) as [string, ...string[]]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
}).strict();

export const listAdminDisputesQuerySchema = listDisputesQuerySchema.extend({
  customerId: uuid.optional(),
  businessId: uuid.optional(),
  assignedAdminId: uuid.optional(),
}).strict();

export type CreateCustomerDisputeRequestDto = z.infer<
  typeof createCustomerDisputeSchema
>;
export type CreateBusinessDisputeRequestDto = z.infer<
  typeof createBusinessDisputeSchema
>;
export type DisputeMessageRequestDto = z.infer<typeof disputeMessageSchema>;
export type DisputeEvidenceRequestDto = z.infer<typeof disputeEvidenceSchema>;
export type DisputeAssignRequestDto = z.infer<typeof disputeAssignSchema>;
export type DisputeResolveRequestDto = z.infer<typeof disputeResolveSchema>;
export type DisputeRejectRequestDto = z.infer<typeof disputeRejectSchema>;
export type DisputeCloseRequestDto = z.infer<typeof disputeCloseSchema>;
export type DisputeInternalMessageRequestDto = z.infer<
  typeof disputeInternalMessageSchema
>;
export type DisputeTransitionRequestDto = z.infer<
  typeof disputeTransitionBodySchema
>;
export type DisputeIdParamsDto = z.infer<typeof disputeIdParamsSchema>;
export type BusinessDisputeParamsDto = z.infer<typeof businessDisputeParamsSchema>;
export type BusinessIdParamsDto = z.infer<typeof businessIdParamsSchema>;
export type ListDisputesQueryDto = z.infer<typeof listDisputesQuerySchema>;
export type ListAdminDisputesQueryDto = z.infer<
  typeof listAdminDisputesQuerySchema
>;
