import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { ReviewStatus } from "../../core/constants/statuses.ts";
import type {
  BusinessIdParamsDto,
  BusinessReviewParamsDto,
  CreateReviewRequestDto,
  DismissReportBodyDto,
  EligibilityIdParamsDto,
  ListAdminReviewsQueryDto,
  ListBusinessReviewsQueryDto,
  ListEligibilitiesQueryDto,
  ListReviewReportsQueryDto,
  ListReviewsQueryDto,
  ModerateReviewBodyDto,
  ReportIdParamsDto,
  ReportReviewRequestDto,
  ResolveReportActionDto,
  ReviewIdParamsDto,
  ReviewResponseRequestDto,
  UpdateReviewRequestDto,
} from "./review.schemas.ts";

type ActorContext = {
  userId: string;
  roles?: string[];
  globalPermissions?: string[];
};

function actorFrom(c: AppContext): ActorContext {
  return {
    userId: c.get("userId")!,
    roles: (c.get("roles") ?? []) as string[],
    globalPermissions: (c.get("permissions") ?? []) as string[],
  };
}

function actorFromOptional(c: AppContext): ActorContext | null {
  const userId = c.get("userId");
  if (!userId) return null;
  return actorFrom(c);
}

function normalizeStatus(
  status: string | string[] | undefined,
): ReviewStatus | ReviewStatus[] | undefined {
  if (!status) return undefined;
  if (Array.isArray(status)) return status as ReviewStatus[];
  return status as ReviewStatus;
}

export async function listReviewEligibilitiesController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListEligibilitiesQueryDto;
  const { reviewService } = createRequestDependencies(c);
  const items = await reviewService.listEligibilitiesForActor(actorFrom(c), {
    isUsed: query.isUsed,
  });
  return successResponse(c, items);
}

export async function getReviewEligibilityController(c: AppContext) {
  const { eligibilityId } = (c.get("validatedParams" as never) ??
    {}) as EligibilityIdParamsDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.getEligibility(actorFrom(c), eligibilityId);
  return successResponse(c, item);
}

export async function listReviewsController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ?? {}) as ListReviewsQueryDto;
  const { reviewService } = createRequestDependencies(c);
  const result = await reviewService.listOwnReviews(actorFrom(c), {
    businessId: query.businessId,
    status: normalizeStatus(query.status as string | string[] | undefined),
    sort: query.sort,
    minRating: query.minRating,
    page: query.page,
    pageSize: query.pageSize,
  });
  return successResponse(c, result.items, 200, result.pagination);
}

export async function createReviewController(c: AppContext) {
  const body = (c.get("validatedBody" as never) ?? {}) as CreateReviewRequestDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.createReview(
    actorFrom(c),
    body,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}

export async function getReviewController(c: AppContext) {
  const { reviewId } = (c.get("validatedParams" as never) ??
    {}) as ReviewIdParamsDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.getReview(actorFrom(c), reviewId);
  return successResponse(c, item);
}

export async function updateReviewController(c: AppContext) {
  const { reviewId } = (c.get("validatedParams" as never) ??
    {}) as ReviewIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as UpdateReviewRequestDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.updateOwnReview(actorFrom(c), reviewId, body);
  return successResponse(c, item);
}

export async function reportReviewController(c: AppContext) {
  const { reviewId } = (c.get("validatedParams" as never) ??
    {}) as ReviewIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as ReportReviewRequestDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.reportReview(actorFrom(c), reviewId, body);
  return successResponse(c, item, 201);
}

export async function listBusinessReviewsController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListBusinessReviewsQueryDto;
  const { reviewService } = createRequestDependencies(c);
  const result = await reviewService.listPublicBusinessReviews(
    businessId,
    actorFromOptional(c),
    {
      status: normalizeStatus(query.status as string | string[] | undefined),
      sort: query.sort,
      minRating: query.minRating,
      page: query.page,
      pageSize: query.pageSize,
    },
  );
  return successResponse(c, result.items, 200, result.pagination);
}

export async function respondToReviewController(c: AppContext) {
  const { businessId, reviewId } = (c.get("validatedParams" as never) ??
    {}) as BusinessReviewParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as ReviewResponseRequestDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.respondToReview(
    actorFrom(c),
    businessId,
    reviewId,
    body,
  );
  return successResponse(c, item, 201);
}

export async function updateReviewResponseController(c: AppContext) {
  const { businessId, reviewId } = (c.get("validatedParams" as never) ??
    {}) as BusinessReviewParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as ReviewResponseRequestDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.updateResponse(
    actorFrom(c),
    businessId,
    reviewId,
    body,
  );
  return successResponse(c, item);
}

export async function listAdminReviewsController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListAdminReviewsQueryDto;
  const { reviewService } = createRequestDependencies(c);
  const result = await reviewService.listAdminReviews(actorFrom(c), {
    customerId: query.customerId,
    businessId: query.businessId,
    status: normalizeStatus(query.status as string | string[] | undefined),
    sort: query.sort,
    minRating: query.minRating,
    page: query.page,
    pageSize: query.pageSize,
  });
  return successResponse(c, result.items, 200, result.pagination);
}

export async function getAdminReviewController(c: AppContext) {
  const { reviewId } = (c.get("validatedParams" as never) ??
    {}) as ReviewIdParamsDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.getReview(actorFrom(c), reviewId);
  return successResponse(c, item);
}

function moderateBody(c: AppContext): ModerateReviewBodyDto {
  return (c.get("validatedBody" as never) ?? {}) as ModerateReviewBodyDto;
}

export async function hideAdminReviewController(c: AppContext) {
  const { reviewId } = (c.get("validatedParams" as never) ??
    {}) as ReviewIdParamsDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.moderateReview(
    actorFrom(c),
    reviewId,
    "hide",
    moderateBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function restoreAdminReviewController(c: AppContext) {
  const { reviewId } = (c.get("validatedParams" as never) ??
    {}) as ReviewIdParamsDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.moderateReview(
    actorFrom(c),
    reviewId,
    "restore",
    moderateBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function removeAdminReviewController(c: AppContext) {
  const { reviewId } = (c.get("validatedParams" as never) ??
    {}) as ReviewIdParamsDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.moderateReview(
    actorFrom(c),
    reviewId,
    "remove",
    moderateBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function listAdminReviewReportsController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListReviewReportsQueryDto;
  const { reviewService } = createRequestDependencies(c);
  const result = await reviewService.listAdminReports(actorFrom(c), {
    status: query.status,
    page: query.page,
    pageSize: query.pageSize,
  });
  return successResponse(c, result.items, 200, result.pagination);
}

export async function dismissAdminReviewReportController(c: AppContext) {
  const { reportId } = (c.get("validatedParams" as never) ??
    {}) as ReportIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as DismissReportBodyDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.dismissReport(actorFrom(c), reportId, body);
  return successResponse(c, item);
}

export async function actionAdminReviewReportController(c: AppContext) {
  const { reportId } = (c.get("validatedParams" as never) ??
    {}) as ReportIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as ResolveReportActionDto;
  const { reviewService } = createRequestDependencies(c);
  const item = await reviewService.actionReport(actorFrom(c), reportId, body);
  return successResponse(c, item);
}
