import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import { requirePermission } from "../../core/auth/authorization.middleware.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { idempotency } from "../../core/idempotency/idempotency.middleware.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import { ApiContract } from "../../contracts/api-contract.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import {
  assignReviewerSchema,
  applicationDocumentParamsSchema,
  applicationIdParamsSchema,
  categoryIdParamsSchema,
  createApplicationSchema,
  createDocumentSchema,
  listApplicationsQuerySchema,
  rejectSchema,
  requestChangesSchema,
  reviewDocumentSchema,
  submitApplicationSchema,
  updateApplicationSchema,
  updateBranchSchema,
} from "./business-application.schemas.ts";
import {
  approveApplicationController,
  assignReviewerController,
  createApplicationController,
  createDocumentController,
  deleteDocumentController,
  getApplicationController,
  listAllApplicationsController,
  listApplicationsController,
  listCategoriesController,
  listDocumentsController,
  listMyApplicationsController,
  listRequirementsController,
  rejectApplicationController,
  requestChangesController,
  reviewDocumentController,
  startReviewController,
  submitApplicationController,
  updateApplicationController,
  updateBranchController,
  withdrawApplicationController,
} from "./business-application.controller.ts";

export const businessApplicationRoutes = new Hono<{ Variables: AppVariables }>();

const idempotencyRepo = (c: { get: (k: keyof AppVariables) => unknown }) =>
  createRequestDependencies(c as never).idempotencyRepository;

businessApplicationRoutes.get(
  ApiContract.routes.businessCategories,
  requireAuthentication(),
  (c) => listCategoriesController(c),
);

businessApplicationRoutes.get(
  ApiContract.routes.businessCategoryRequirements,
  requireAuthentication(),
  validate({ params: categoryIdParamsSchema }),
  (c) => listRequirementsController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplications,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.Create),
  validate({ body: createApplicationSchema }),
  (c) => createApplicationController(c),
);

businessApplicationRoutes.get(
  ApiContract.routes.businessApplications,
  requireAuthentication(),
  validate({ query: listApplicationsQuerySchema }),
  (c) => listApplicationsController(c),
);

businessApplicationRoutes.get(
  ApiContract.routes.businessApplicationById,
  requireAuthentication(),
  validate({ params: applicationIdParamsSchema }),
  (c) => getApplicationController(c),
);

businessApplicationRoutes.patch(
  ApiContract.routes.businessApplicationById,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.UpdateOwn),
  validate({ params: applicationIdParamsSchema, body: updateApplicationSchema }),
  (c) => updateApplicationController(c),
);

businessApplicationRoutes.patch(
  ApiContract.routes.businessApplicationBranch,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.UpdateOwn),
  validate({ params: applicationIdParamsSchema, body: updateBranchSchema }),
  (c) => updateBranchController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplicationSubmit,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.Submit),
  idempotency("business.application.submit", idempotencyRepo),
  validate({ params: applicationIdParamsSchema, body: submitApplicationSchema }),
  (c) => submitApplicationController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplicationWithdraw,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.Withdraw),
  validate({ params: applicationIdParamsSchema, body: submitApplicationSchema }),
  (c) => withdrawApplicationController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplicationAssignReviewer,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.AssignReviewer),
  validate({ params: applicationIdParamsSchema, body: assignReviewerSchema }),
  (c) => assignReviewerController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplicationStartReview,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.StartReview),
  validate({ params: applicationIdParamsSchema, body: submitApplicationSchema }),
  (c) => startReviewController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplicationRequestChanges,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.RequestChanges),
  validate({ params: applicationIdParamsSchema, body: requestChangesSchema }),
  (c) => requestChangesController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplicationApprove,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.Approve),
  idempotency("business.application.approve", idempotencyRepo),
  validate({ params: applicationIdParamsSchema, body: submitApplicationSchema }),
  (c) => approveApplicationController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplicationReject,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.Reject),
  validate({ params: applicationIdParamsSchema, body: rejectSchema }),
  (c) => rejectApplicationController(c),
);

businessApplicationRoutes.get(
  ApiContract.routes.businessApplicationDocuments,
  requireAuthentication(),
  validate({ params: applicationIdParamsSchema }),
  (c) => listDocumentsController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplicationDocuments,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.UpdateOwn),
  validate({ params: applicationIdParamsSchema, body: createDocumentSchema }),
  (c) => createDocumentController(c),
);

businessApplicationRoutes.delete(
  ApiContract.routes.businessApplicationDocumentById,
  requireAuthentication(),
  requirePermission(Permissions.BusinessApplication.UpdateOwn),
  validate({ params: applicationDocumentParamsSchema }),
  (c) => deleteDocumentController(c),
);

businessApplicationRoutes.post(
  ApiContract.routes.businessApplicationDocumentReview,
  requireAuthentication(),
  requirePermission(Permissions.BusinessDocument.Review),
  validate({
    params: applicationDocumentParamsSchema,
    body: reviewDocumentSchema,
  }),
  (c) => reviewDocumentController(c),
);
