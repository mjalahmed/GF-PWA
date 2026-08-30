import { z } from "npm:zod@3.24.1";
import {
  ReviewRatingDimensions,
  ReviewReportReasons,
  ReviewStatuses,
} from "../../core/constants/statuses.ts";
import { paginationQuerySchema } from "../../core/validation/common.schemas.ts";

const uuid = z.string().uuid();

const dimensionRatingSchema = z.number().int().min(1).max(5);

const ratingsObjectSchema = z.object({
  [ReviewRatingDimensions.WorkQuality]: dimensionRatingSchema,
  [ReviewRatingDimensions.PricingTransparency]: dimensionRatingSchema,
  [ReviewRatingDimensions.Timeliness]: dimensionRatingSchema,
  [ReviewRatingDimensions.CustomerService]: dimensionRatingSchema,
  [ReviewRatingDimensions.OverallExperience]: dimensionRatingSchema,
}).strict();

export const createReviewSchema = z.object({
  eligibilityId: uuid,
  overallRating: dimensionRatingSchema,
  comment: z.string().max(4000).nullable().optional(),
  ratings: ratingsObjectSchema,
}).strict();

export const updateReviewSchema = z.object({
  overallRating: dimensionRatingSchema,
  comment: z.string().max(4000).nullable().optional(),
  ratings: ratingsObjectSchema,
}).strict();

export const reportReviewSchema = z.object({
  reasonCode: z.enum(
    Object.values(ReviewReportReasons) as [string, ...string[]],
  ),
  details: z.string().max(2000).nullable().optional(),
}).strict();

export const reviewResponseSchema = z.object({
  response: z.string().min(1).max(4000),
}).strict();

export const moderateReviewBodySchema = z.object({
  reason: z.string().max(2000).nullable().optional(),
}).strict();

export const resolveReportActionSchema = z.object({
  action: z.enum(["hide", "remove", "flag"]),
  reason: z.string().max(2000).nullable().optional(),
}).strict();

export const dismissReportBodySchema = z.object({
  reason: z.string().max(2000).nullable().optional(),
}).strict();

export const eligibilityIdParamsSchema = z.object({
  eligibilityId: uuid,
}).strict();

export const reviewIdParamsSchema = z.object({
  reviewId: uuid,
}).strict();

export const reportIdParamsSchema = z.object({
  reportId: uuid,
}).strict();

export const businessIdParamsSchema = z.object({
  businessId: uuid,
}).strict();

export const businessReviewParamsSchema = z.object({
  businessId: uuid,
  reviewId: uuid,
}).strict();

export const listEligibilitiesQuerySchema = z.object({
  isUsed: z
    .union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")])
    .optional(),
}).strict();

export const listReviewsQuerySchema = paginationQuerySchema.extend({
  businessId: uuid.optional(),
  status: z
    .union([
      z.enum(Object.values(ReviewStatuses) as [string, ...string[]]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(["newest", "highest", "lowest"]).optional(),
}).strict();

export const listBusinessReviewsQuerySchema = paginationQuerySchema.extend({
  status: z
    .union([
      z.enum(Object.values(ReviewStatuses) as [string, ...string[]]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  sort: z.enum(["newest", "highest", "lowest"]).optional(),
}).strict();

export const listAdminReviewsQuerySchema = listReviewsQuerySchema.extend({
  customerId: uuid.optional(),
}).strict();

export const listReviewReportsQuerySchema = paginationQuerySchema.extend({
  status: z
    .union([
      z.enum(["open", "reviewed", "dismissed", "action_taken"]),
      z.string().transform((v) => v.split(",").map((s) => s.trim())),
    ])
    .optional(),
}).strict();

export type CreateReviewRequestDto = z.infer<typeof createReviewSchema>;
export type UpdateReviewRequestDto = z.infer<typeof updateReviewSchema>;
export type ReportReviewRequestDto = z.infer<typeof reportReviewSchema>;
export type ReviewResponseRequestDto = z.infer<typeof reviewResponseSchema>;
export type ModerateReviewBodyDto = z.infer<typeof moderateReviewBodySchema>;
export type ResolveReportActionDto = z.infer<typeof resolveReportActionSchema>;
export type DismissReportBodyDto = z.infer<typeof dismissReportBodySchema>;
export type EligibilityIdParamsDto = z.infer<typeof eligibilityIdParamsSchema>;
export type ReviewIdParamsDto = z.infer<typeof reviewIdParamsSchema>;
export type ReportIdParamsDto = z.infer<typeof reportIdParamsSchema>;
export type BusinessIdParamsDto = z.infer<typeof businessIdParamsSchema>;
export type BusinessReviewParamsDto = z.infer<typeof businessReviewParamsSchema>;
export type ListEligibilitiesQueryDto = z.infer<typeof listEligibilitiesQuerySchema>;
export type ListReviewsQueryDto = z.infer<typeof listReviewsQuerySchema>;
export type ListBusinessReviewsQueryDto = z.infer<
  typeof listBusinessReviewsQuerySchema
>;
export type ListAdminReviewsQueryDto = z.infer<typeof listAdminReviewsQuerySchema>;
export type ListReviewReportsQueryDto = z.infer<
  typeof listReviewReportsQuerySchema
>;
