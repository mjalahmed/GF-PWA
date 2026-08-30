import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import {
  requireBusinessMembership,
  requireBusinessPermission,
} from "../../core/auth/business-authorization.middleware.ts";
import {
  requireAnyPermission,
  requirePermission,
} from "../../core/auth/authorization.middleware.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { idempotency } from "../../core/idempotency/idempotency.middleware.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import { ApiContract } from "../../contracts/api-contract.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import {
  businessIdParamsSchema,
  businessReviewParamsSchema,
  createReviewSchema,
  dismissReportBodySchema,
  eligibilityIdParamsSchema,
  listAdminReviewsQuerySchema,
  listBusinessReviewsQuerySchema,
  listEligibilitiesQuerySchema,
  listReviewReportsQuerySchema,
  listReviewsQuerySchema,
  moderateReviewBodySchema,
  reportIdParamsSchema,
  reportReviewSchema,
  resolveReportActionSchema,
  reviewIdParamsSchema,
  reviewResponseSchema,
  updateReviewSchema,
} from "./review.schemas.ts";
import {
  actionAdminReviewReportController,
  createReviewController,
  dismissAdminReviewReportController,
  getAdminReviewController,
  getReviewController,
  getReviewEligibilityController,
  hideAdminReviewController,
  listAdminReviewReportsController,
  listAdminReviewsController,
  listBusinessReviewsController,
  listReviewEligibilitiesController,
  listReviewsController,
  removeAdminReviewController,
  reportReviewController,
  respondToReviewController,
  restoreAdminReviewController,
  updateReviewController,
  updateReviewResponseController,
} from "./review.controller.ts";

export const reviewRoutes = new Hono<{ Variables: AppVariables }>();

const idempotencyRepo = (c: { get: (k: keyof AppVariables) => unknown }) =>
  createRequestDependencies(c as never).idempotencyRepository;

reviewRoutes.get(
  ApiContract.routes.reviewEligibilities,
  requireAuthentication(),
  requireAnyPermission(Permissions.Review.EligibilityReadOwn),
  validate({ query: listEligibilitiesQuerySchema }),
  (c) => listReviewEligibilitiesController(c),
);

reviewRoutes.get(
  ApiContract.routes.reviewEligibilityById,
  requireAuthentication(),
  requireAnyPermission(Permissions.Review.EligibilityReadOwn),
  validate({ params: eligibilityIdParamsSchema }),
  (c) => getReviewEligibilityController(c),
);

reviewRoutes.get(
  ApiContract.routes.reviews,
  requireAuthentication(),
  requireAnyPermission(Permissions.Review.ReadOwn),
  validate({ query: listReviewsQuerySchema }),
  (c) => listReviewsController(c),
);

reviewRoutes.post(
  ApiContract.routes.reviews,
  requireAuthentication(),
  requireAnyPermission(Permissions.Review.Create),
  validate({ body: createReviewSchema }),
  idempotency("review.create", idempotencyRepo),
  (c) => createReviewController(c),
);

reviewRoutes.get(
  ApiContract.routes.reviewById,
  requireAuthentication(),
  validate({ params: reviewIdParamsSchema }),
  (c) => getReviewController(c),
);

reviewRoutes.patch(
  ApiContract.routes.reviewById,
  requireAuthentication(),
  requireAnyPermission(Permissions.Review.UpdateOwn),
  validate({ params: reviewIdParamsSchema, body: updateReviewSchema }),
  (c) => updateReviewController(c),
);

reviewRoutes.post(
  ApiContract.routes.reviewReport,
  requireAuthentication(),
  requireAnyPermission(Permissions.Review.Report),
  validate({ params: reviewIdParamsSchema, body: reportReviewSchema }),
  idempotency("review.report", idempotencyRepo),
  (c) => reportReviewController(c),
);

reviewRoutes.get(
  ApiContract.routes.businessReviews,
  validate({
    params: businessIdParamsSchema,
    query: listBusinessReviewsQuerySchema,
  }),
  (c) => listBusinessReviewsController(c),
);

reviewRoutes.post(
  ApiContract.routes.businessReviewResponse,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessReview.Respond),
  validate({ params: businessReviewParamsSchema, body: reviewResponseSchema }),
  idempotency("review.respond", idempotencyRepo),
  (c) => respondToReviewController(c),
);

reviewRoutes.patch(
  ApiContract.routes.businessReviewResponse,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessReview.Respond),
  validate({ params: businessReviewParamsSchema, body: reviewResponseSchema }),
  (c) => updateReviewResponseController(c),
);

reviewRoutes.get(
  ApiContract.routes.adminReviews,
  requireAuthentication(),
  requirePermission(Permissions.Review.Moderate),
  validate({ query: listAdminReviewsQuerySchema }),
  (c) => listAdminReviewsController(c),
);

reviewRoutes.get(
  ApiContract.routes.adminReviewById,
  requireAuthentication(),
  requirePermission(Permissions.Review.Moderate),
  validate({ params: reviewIdParamsSchema }),
  (c) => getAdminReviewController(c),
);

reviewRoutes.post(
  ApiContract.routes.adminReviewHide,
  requireAuthentication(),
  requirePermission(Permissions.Review.Moderate),
  validate({ params: reviewIdParamsSchema, body: moderateReviewBodySchema }),
  idempotency("review.hide", idempotencyRepo),
  (c) => hideAdminReviewController(c),
);

reviewRoutes.post(
  ApiContract.routes.adminReviewRestore,
  requireAuthentication(),
  requirePermission(Permissions.Review.Moderate),
  validate({ params: reviewIdParamsSchema, body: moderateReviewBodySchema }),
  idempotency("review.restore", idempotencyRepo),
  (c) => restoreAdminReviewController(c),
);

reviewRoutes.post(
  ApiContract.routes.adminReviewRemove,
  requireAuthentication(),
  requirePermission(Permissions.Review.Moderate),
  validate({ params: reviewIdParamsSchema, body: moderateReviewBodySchema }),
  idempotency("review.remove", idempotencyRepo),
  (c) => removeAdminReviewController(c),
);

reviewRoutes.get(
  ApiContract.routes.adminReviewReports,
  requireAuthentication(),
  requirePermission(Permissions.Review.ReportRead),
  validate({ query: listReviewReportsQuerySchema }),
  (c) => listAdminReviewReportsController(c),
);

reviewRoutes.post(
  ApiContract.routes.adminReviewReportDismiss,
  requireAuthentication(),
  requirePermission(Permissions.Review.ReportResolve),
  validate({ params: reportIdParamsSchema, body: dismissReportBodySchema }),
  idempotency("review.report.dismiss", idempotencyRepo),
  (c) => dismissAdminReviewReportController(c),
);

reviewRoutes.post(
  ApiContract.routes.adminReviewReportAction,
  requireAuthentication(),
  requirePermission(Permissions.Review.ReportResolve),
  validate({ params: reportIdParamsSchema, body: resolveReportActionSchema }),
  idempotency("review.report.action", idempotencyRepo),
  (c) => actionAdminReviewReportController(c),
);
