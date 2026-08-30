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
  businessDisputeParamsSchema,
  businessIdParamsSchema,
  createBusinessDisputeSchema,
  createCustomerDisputeSchema,
  disputeAssignSchema,
  disputeCloseSchema,
  disputeEvidenceSchema,
  disputeIdParamsSchema,
  disputeInternalMessageSchema,
  disputeMessageSchema,
  disputeRejectSchema,
  disputeResolveSchema,
  disputeTransitionBodySchema,
  listAdminDisputesQuerySchema,
  listDisputesQuerySchema,
} from "./dispute.schemas.ts";
import {
  addAdminInternalMessageController,
  addBusinessDisputeEvidenceController,
  addBusinessDisputeMessageController,
  addCustomerDisputeEvidenceController,
  addCustomerDisputeMessageController,
  assignAdminDisputeController,
  closeAdminDisputeController,
  createBusinessDisputeController,
  createCustomerDisputeController,
  getAdminDisputeController,
  getBusinessDisputeController,
  getCustomerDisputeController,
  listAdminDisputesController,
  listBusinessDisputesController,
  listCustomerDisputesController,
  rejectAdminDisputeController,
  requestBusinessDisputeController,
  requestCustomerDisputeController,
  resolveAdminDisputeController,
  startReviewDisputeController,
  withdrawCustomerDisputeController,
} from "./dispute.controller.ts";

export const disputeRoutes = new Hono<{ Variables: AppVariables }>();

const idempotencyRepo = (c: { get: (k: keyof AppVariables) => unknown }) =>
  createRequestDependencies(c as never).idempotencyRepository;

disputeRoutes.get(
  ApiContract.routes.disputes,
  requireAuthentication(),
  requireAnyPermission(Permissions.Dispute.ReadOwn),
  validate({ query: listDisputesQuerySchema }),
  (c) => listCustomerDisputesController(c),
);

disputeRoutes.post(
  ApiContract.routes.disputes,
  requireAuthentication(),
  requireAnyPermission(Permissions.Dispute.Create),
  validate({ body: createCustomerDisputeSchema }),
  idempotency("dispute.create", idempotencyRepo),
  (c) => createCustomerDisputeController(c),
);

disputeRoutes.get(
  ApiContract.routes.disputeById,
  requireAuthentication(),
  requireAnyPermission(Permissions.Dispute.ReadOwn),
  validate({ params: disputeIdParamsSchema }),
  (c) => getCustomerDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.disputeMessages,
  requireAuthentication(),
  requireAnyPermission(Permissions.Dispute.MessageOwn),
  validate({ params: disputeIdParamsSchema, body: disputeMessageSchema }),
  idempotency("dispute.message", idempotencyRepo),
  (c) => addCustomerDisputeMessageController(c),
);

disputeRoutes.post(
  ApiContract.routes.disputeEvidence,
  requireAuthentication(),
  requireAnyPermission(Permissions.Dispute.EvidenceOwn),
  validate({ params: disputeIdParamsSchema, body: disputeEvidenceSchema }),
  idempotency("dispute.evidence", idempotencyRepo),
  (c) => addCustomerDisputeEvidenceController(c),
);

disputeRoutes.post(
  ApiContract.routes.disputeWithdraw,
  requireAuthentication(),
  requireAnyPermission(Permissions.Dispute.ReadOwn),
  validate({ params: disputeIdParamsSchema }),
  idempotency("dispute.withdraw", idempotencyRepo),
  (c) => withdrawCustomerDisputeController(c),
);

disputeRoutes.get(
  ApiContract.routes.businessDisputes,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessDispute.Read),
  validate({ params: businessIdParamsSchema, query: listDisputesQuerySchema }),
  (c) => listBusinessDisputesController(c),
);

disputeRoutes.post(
  ApiContract.routes.businessDisputes,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessDispute.Create),
  validate({ params: businessIdParamsSchema, body: createBusinessDisputeSchema }),
  idempotency("dispute.business.create", idempotencyRepo),
  (c) => createBusinessDisputeController(c),
);

disputeRoutes.get(
  ApiContract.routes.businessDisputeById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessDispute.Read),
  validate({ params: businessDisputeParamsSchema }),
  (c) => getBusinessDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.businessDisputeMessages,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessDispute.Respond),
  validate({ params: businessDisputeParamsSchema, body: disputeMessageSchema }),
  idempotency("dispute.business.message", idempotencyRepo),
  (c) => addBusinessDisputeMessageController(c),
);

disputeRoutes.post(
  ApiContract.routes.businessDisputeEvidence,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessDispute.Evidence),
  validate({ params: businessDisputeParamsSchema, body: disputeEvidenceSchema }),
  idempotency("dispute.business.evidence", idempotencyRepo),
  (c) => addBusinessDisputeEvidenceController(c),
);

disputeRoutes.get(
  ApiContract.routes.adminDisputes,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.ReadAll),
  validate({ query: listAdminDisputesQuerySchema }),
  (c) => listAdminDisputesController(c),
);

disputeRoutes.get(
  ApiContract.routes.adminDisputeById,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.ReadAll),
  validate({ params: disputeIdParamsSchema }),
  (c) => getAdminDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.adminDisputeAssign,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.Assign),
  validate({ params: disputeIdParamsSchema, body: disputeAssignSchema }),
  idempotency("dispute.assign", idempotencyRepo),
  (c) => assignAdminDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.adminDisputeRequestCustomer,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.RequestResponse),
  validate({ params: disputeIdParamsSchema, body: disputeTransitionBodySchema }),
  idempotency("dispute.request_customer", idempotencyRepo),
  (c) => requestCustomerDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.adminDisputeRequestBusiness,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.RequestResponse),
  validate({ params: disputeIdParamsSchema, body: disputeTransitionBodySchema }),
  idempotency("dispute.request_business", idempotencyRepo),
  (c) => requestBusinessDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.adminDisputeStartReview,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.Review),
  validate({ params: disputeIdParamsSchema, body: disputeTransitionBodySchema }),
  idempotency("dispute.start_review", idempotencyRepo),
  (c) => startReviewDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.adminDisputeResolve,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.Resolve),
  validate({ params: disputeIdParamsSchema, body: disputeResolveSchema }),
  idempotency("dispute.resolve", idempotencyRepo),
  (c) => resolveAdminDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.adminDisputeReject,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.Reject),
  validate({ params: disputeIdParamsSchema, body: disputeRejectSchema }),
  idempotency("dispute.reject", idempotencyRepo),
  (c) => rejectAdminDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.adminDisputeClose,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.Close),
  validate({ params: disputeIdParamsSchema, body: disputeCloseSchema }),
  idempotency("dispute.close", idempotencyRepo),
  (c) => closeAdminDisputeController(c),
);

disputeRoutes.post(
  ApiContract.routes.adminDisputeInternalMessages,
  requireAuthentication(),
  requirePermission(Permissions.Dispute.InternalNote),
  validate({ params: disputeIdParamsSchema, body: disputeInternalMessageSchema }),
  idempotency("dispute.internal_message", idempotencyRepo),
  (c) => addAdminInternalMessageController(c),
);
