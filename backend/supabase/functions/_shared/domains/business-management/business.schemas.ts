import { z } from "npm:zod@3.24.1";

const uuidSchema = z.string().uuid();
const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{8,20}$/, "Enter a valid phone number");
const emailSchema = z.string().trim().email();
const timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);

export const businessIdParamsSchema = z.object({
  businessId: uuidSchema,
}).strict();

export const branchParamsSchema = z.object({
  businessId: uuidSchema,
  branchId: uuidSchema,
}).strict();

export const membershipParamsSchema = z.object({
  businessId: uuidSchema,
  membershipId: uuidSchema,
}).strict();

export const invitationParamsSchema = z.object({
  businessId: uuidSchema,
  invitationId: uuidSchema,
}).strict();

export const closureParamsSchema = z.object({
  businessId: uuidSchema,
  closureId: uuidSchema,
}).strict();

export const invitationTokenParamsSchema = z.object({
  token: z.string().trim().min(32).max(128),
}).strict();

export const updateBusinessSchema = z.object({
  displayName: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  website: z.string().trim().url().nullable().optional(),
  logoPath: z.string().trim().max(500).nullable().optional(),
  coverPath: z.string().trim().max(500).nullable().optional(),
}).strict();

export const updateBusinessSettingsSchema = z.object({
  appointmentsEnabled: z.boolean().optional(),
  productsEnabled: z.boolean().optional(),
  quotationsEnabled: z.boolean().optional(),
  invoicesEnabled: z.boolean().optional(),
  cashPaymentsEnabled: z.boolean().optional(),
  onlinePaymentsEnabled: z.boolean().optional(),
  reviewsEnabled: z.boolean().optional(),
  autoConfirmAppointments: z.boolean().optional(),
  defaultAppointmentDurationMinutes: z.number().int().min(0).nullable().optional(),
  minimumBookingNoticeMinutes: z.number().int().min(0).nullable().optional(),
  maximumBookingDaysAhead: z.number().int().min(0).nullable().optional(),
  cancellationNoticeMinutes: z.number().int().min(0).nullable().optional(),
  currency: z.string().trim().length(3).optional(),
  locale: z.string().trim().min(2).max(10).optional(),
  timezone: z.string().trim().max(64).optional(),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export const openingHoursQuerySchema = z.object({
  branchId: uuidSchema.optional(),
}).strict();

export const openingHoursDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  opensAt: timeSchema.nullable().optional(),
  closesAt: timeSchema.nullable().optional(),
  isClosed: z.boolean(),
}).strict().superRefine((val, ctx) => {
  if (val.isClosed) {
    if (val.opensAt != null || val.closesAt != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Closed days must not include opening times.",
      });
    }
  } else if (!val.opensAt || !val.closesAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Open days require both opensAt and closesAt.",
    });
  } else if (val.opensAt >= val.closesAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "opensAt must be before closesAt.",
      path: ["opensAt"],
    });
  }
});

export const replaceOpeningHoursSchema = z.object({
  branchId: uuidSchema.nullable().optional(),
  schedule: z.array(openingHoursDaySchema).min(1).max(7),
}).strict();

export const closureDatesQuerySchema = z.object({
  branchId: uuidSchema.optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
}).strict();

export const createClosureDateSchema = z.object({
  branchId: uuidSchema.nullable().optional(),
  closureDate: z.string().date(),
  reason: z.string().trim().max(500).nullable().optional(),
  isFullDay: z.boolean().default(true),
  opensAt: timeSchema.nullable().optional(),
  closesAt: timeSchema.nullable().optional(),
}).strict().superRefine((val, ctx) => {
  if (val.isFullDay) {
    if (val.opensAt != null || val.closesAt != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Full-day closures must not include opening times.",
      });
    }
  } else if (!val.opensAt || !val.closesAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Partial closures require both opensAt and closesAt.",
    });
  }
});

export const updateClosureDateSchema = z.object({
  branchId: uuidSchema.nullable().optional(),
  closureDate: z.string().date().optional(),
  reason: z.string().trim().max(500).nullable().optional(),
  isFullDay: z.boolean().optional(),
  opensAt: timeSchema.nullable().optional(),
  closesAt: timeSchema.nullable().optional(),
}).strict();

export type BusinessIdParamsDto = z.infer<typeof businessIdParamsSchema>;
export type UpdateBusinessRequestDto = z.infer<typeof updateBusinessSchema>;
export type UpdateBusinessSettingsRequestDto = z.infer<
  typeof updateBusinessSettingsSchema
>;
export type OpeningHoursQueryDto = z.infer<typeof openingHoursQuerySchema>;
export type ReplaceOpeningHoursRequestDto = z.infer<
  typeof replaceOpeningHoursSchema
>;
export type ClosureDatesQueryDto = z.infer<typeof closureDatesQuerySchema>;
export type CreateClosureDateRequestDto = z.infer<typeof createClosureDateSchema>;
export type UpdateClosureDateRequestDto = z.infer<typeof updateClosureDateSchema>;
export type ClosureParamsDto = z.infer<typeof closureParamsSchema>;
