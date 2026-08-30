import { z } from "npm:zod@3.24.1";
import { BusinessApplicationStatuses } from "../../core/constants/statuses.ts";

const uuidSchema = z.string().uuid();
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{8,20}$/, "Enter a valid phone number");
const emailSchema = z.string().trim().email();

export const createApplicationSchema = z
  .object({
    businessCategoryId: uuidSchema,
    legalName: z.string().trim().min(2).max(200),
    displayName: z.string().trim().min(2).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    commercialRegistrationNumber: z.string().trim().max(100).nullable().optional(),
    phone: phoneSchema,
    email: emailSchema,
    website: z.string().trim().url().nullable().optional(),
  })
  .strict();

export const updateApplicationSchema = z
  .object({
    businessCategoryId: uuidSchema.optional(),
    legalName: z.string().trim().min(2).max(200).optional(),
    displayName: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    commercialRegistrationNumber: z.string().trim().max(100).nullable().optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    website: z.string().trim().url().nullable().optional(),
    currentStep: z
      .enum([
        "business_information",
        "contact_information",
        "branch_information",
        "documents",
        "review_and_submit",
      ])
      .optional(),
  })
  .strict();

export const updateBranchSchema = z
  .object({
    name: z.string().trim().max(200).nullable().optional(),
    phone: phoneSchema.nullable().optional(),
    email: emailSchema.nullable().optional(),
    addressLine: z.string().trim().max(500).nullable().optional(),
    area: z.string().trim().max(120).nullable().optional(),
    city: z.string().trim().max(120).nullable().optional(),
    countryCode: z.string().trim().length(2).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    timezone: z.string().trim().max(64).optional(),
  })
  .strict();

export const submitApplicationSchema = z.object({}).strict();

export const assignReviewerSchema = z
  .object({
    reviewerId: uuidSchema,
  })
  .strict();

export const requestChangesSchema = z
  .object({
    reason: z.string().trim().min(5).max(2000),
  })
  .strict();

export const rejectSchema = z
  .object({
    reason: z.string().trim().min(5).max(2000),
  })
  .strict();

export const createDocumentSchema = z
  .object({
    documentRequirementId: uuidSchema,
    originalFileName: z.string().trim().min(1).max(255),
    mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
    fileSizeBytes: z.number().int().positive().max(52_428_800),
    documentNumber: z.string().trim().max(120).nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  })
  .strict();

export const reviewDocumentSchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    rejectionReason: z.string().trim().min(5).max(2000).nullable().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.status === "rejected" && !value.rejectionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "rejectionReason is required when status is rejected",
        path: ["rejectionReason"],
      });
    }
  });

export const listApplicationsQuerySchema = z
  .object({
    status: z.nativeEnum(BusinessApplicationStatuses).optional(),
    assignedReviewerId: uuidSchema.optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export const applicationIdParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

export const applicationDocumentParamsSchema = z
  .object({
    id: uuidSchema,
    documentId: uuidSchema,
  })
  .strict();

export const categoryIdParamsSchema = z
  .object({
    categoryId: uuidSchema,
  })
  .strict();

export type CreateApplicationRequestDto = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationRequestDto = z.infer<typeof updateApplicationSchema>;
export type UpdateBranchRequestDto = z.infer<typeof updateBranchSchema>;
export type AssignReviewerRequestDto = z.infer<typeof assignReviewerSchema>;
export type RequestChangesRequestDto = z.infer<typeof requestChangesSchema>;
export type RejectApplicationRequestDto = z.infer<typeof rejectSchema>;
export type CreateDocumentRequestDto = z.infer<typeof createDocumentSchema>;
export type ReviewDocumentRequestDto = z.infer<typeof reviewDocumentSchema>;
export type ListApplicationsQueryDto = z.infer<typeof listApplicationsQuerySchema>;
export type ApplicationIdParamsDto = z.infer<typeof applicationIdParamsSchema>;
export type ApplicationDocumentParamsDto = z.infer<
  typeof applicationDocumentParamsSchema
>;
export type CategoryIdParamsDto = z.infer<typeof categoryIdParamsSchema>;
