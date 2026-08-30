import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import {
  requireBusinessMembership,
  requireBusinessPermission,
} from "../../core/auth/business-authorization.middleware.ts";
import { requireAnyPermission } from "../../core/auth/authorization.middleware.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { idempotency } from "../../core/idempotency/idempotency.middleware.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import { ApiContract } from "../../contracts/api-contract.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import {
  appointmentQuotationParamsSchema,
  businessIdParamsSchema,
  businessQuotationParamsSchema,
  createFromAppointmentSchema,
  createQuotationSchema,
  listBusinessQuotationsQuerySchema,
  listQuotationsQuerySchema,
  quotationIdParamsSchema,
  transitionBodySchema,
  updateQuotationSchema,
} from "./quotation.schemas.ts";
import {
  acceptQuotationController,
  cancelBusinessQuotationController,
  createAppointmentQuotationController,
  createBusinessQuotationController,
  getBusinessQuotationController,
  getQuotationController,
  issueBusinessQuotationController,
  listBusinessQuotationsController,
  listQuotationsController,
  rejectQuotationController,
  reviseBusinessQuotationController,
  updateBusinessQuotationController,
  viewQuotationController,
} from "./quotation.controller.ts";

export const quotationRoutes = new Hono<{ Variables: AppVariables }>();

const idempotencyRepo = (c: { get: (k: keyof AppVariables) => unknown }) =>
  createRequestDependencies(c as never).idempotencyRepository;

quotationRoutes.get(
  ApiContract.routes.quotations,
  requireAuthentication(),
  requireAnyPermission(Permissions.Quotation.ReadOwn),
  validate({ query: listQuotationsQuerySchema }),
  (c) => listQuotationsController(c),
);

quotationRoutes.get(
  ApiContract.routes.quotationById,
  requireAuthentication(),
  validate({ params: quotationIdParamsSchema }),
  (c) => getQuotationController(c),
);

quotationRoutes.post(
  ApiContract.routes.quotationView,
  requireAuthentication(),
  validate({ params: quotationIdParamsSchema, body: transitionBodySchema }),
  idempotency("quotation.view", idempotencyRepo),
  (c) => viewQuotationController(c),
);

quotationRoutes.post(
  ApiContract.routes.quotationAccept,
  requireAuthentication(),
  requireAnyPermission(Permissions.Quotation.AcceptOwn),
  validate({ params: quotationIdParamsSchema, body: transitionBodySchema }),
  idempotency("quotation.accept", idempotencyRepo),
  (c) => acceptQuotationController(c),
);

quotationRoutes.post(
  ApiContract.routes.quotationReject,
  requireAuthentication(),
  requireAnyPermission(Permissions.Quotation.RejectOwn),
  validate({ params: quotationIdParamsSchema, body: transitionBodySchema }),
  idempotency("quotation.reject", idempotencyRepo),
  (c) => rejectQuotationController(c),
);

quotationRoutes.get(
  ApiContract.routes.businessQuotations,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessQuotation.Read),
  validate({
    params: businessIdParamsSchema,
    query: listBusinessQuotationsQuerySchema,
  }),
  (c) => listBusinessQuotationsController(c),
);

quotationRoutes.post(
  ApiContract.routes.businessQuotations,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessQuotation.Create),
  validate({ params: businessIdParamsSchema, body: createQuotationSchema }),
  idempotency("quotation.create", idempotencyRepo),
  (c) => createBusinessQuotationController(c),
);

quotationRoutes.get(
  ApiContract.routes.businessQuotationById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessQuotation.Read),
  validate({ params: businessQuotationParamsSchema }),
  (c) => getBusinessQuotationController(c),
);

quotationRoutes.patch(
  ApiContract.routes.businessQuotationById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessQuotation.Update),
  validate({ params: businessQuotationParamsSchema, body: updateQuotationSchema }),
  (c) => updateBusinessQuotationController(c),
);

quotationRoutes.post(
  ApiContract.routes.businessQuotationIssue,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessQuotation.Issue),
  validate({ params: businessQuotationParamsSchema, body: transitionBodySchema }),
  idempotency("quotation.issue", idempotencyRepo),
  (c) => issueBusinessQuotationController(c),
);

quotationRoutes.post(
  ApiContract.routes.businessQuotationRevise,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessQuotation.Revise),
  validate({ params: businessQuotationParamsSchema, body: transitionBodySchema }),
  idempotency("quotation.revise", idempotencyRepo),
  (c) => reviseBusinessQuotationController(c),
);

quotationRoutes.post(
  ApiContract.routes.businessQuotationCancel,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessQuotation.Cancel),
  validate({ params: businessQuotationParamsSchema, body: transitionBodySchema }),
  idempotency("quotation.cancel", idempotencyRepo),
  (c) => cancelBusinessQuotationController(c),
);

quotationRoutes.post(
  ApiContract.routes.businessAppointmentQuotation,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessQuotation.Create),
  validate({
    params: appointmentQuotationParamsSchema,
    body: createFromAppointmentSchema,
  }),
  idempotency("quotation.create_from_appointment", idempotencyRepo),
  (c) => createAppointmentQuotationController(c),
);
