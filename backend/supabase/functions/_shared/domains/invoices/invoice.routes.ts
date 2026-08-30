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
  appointmentInvoiceParamsSchema,
  businessIdParamsSchema,
  businessInvoiceParamsSchema,
  createFromAppointmentSchema,
  createFromQuotationSchema,
  createInvoiceSchema,
  invoiceIdParamsSchema,
  listBusinessInvoicesQuerySchema,
  listBusinessPaymentsQuerySchema,
  listInvoicesQuerySchema,
  listPaymentsQuerySchema,
  paymentIdParamsSchema,
  quotationInvoiceParamsSchema,
  recordCashPaymentSchema,
  transitionBodySchema,
  updateInvoiceSchema,
} from "./invoice.schemas.ts";
import {
  approveInvoiceController,
  cancelBusinessInvoiceController,
  createAppointmentInvoiceController,
  createBusinessInvoiceController,
  createQuotationInvoiceController,
  getBusinessInvoiceController,
  getInvoiceController,
  getPaymentController,
  issueBusinessInvoiceController,
  listBusinessInvoicePaymentsController,
  listBusinessInvoicesController,
  listBusinessPaymentsController,
  listInvoicePaymentsController,
  listInvoicesController,
  listPaymentsController,
  recordCashPaymentController,
  updateBusinessInvoiceController,
  viewInvoiceController,
} from "./invoice.controller.ts";

export const invoiceRoutes = new Hono<{ Variables: AppVariables }>();

const idempotencyRepo = (c: { get: (k: keyof AppVariables) => unknown }) =>
  createRequestDependencies(c as never).idempotencyRepository;

invoiceRoutes.get(
  ApiContract.routes.invoices,
  requireAuthentication(),
  requireAnyPermission(Permissions.Invoice.ReadOwn),
  validate({ query: listInvoicesQuerySchema }),
  (c) => listInvoicesController(c),
);

invoiceRoutes.get(
  ApiContract.routes.invoiceById,
  requireAuthentication(),
  validate({ params: invoiceIdParamsSchema }),
  (c) => getInvoiceController(c),
);

invoiceRoutes.post(
  ApiContract.routes.invoiceView,
  requireAuthentication(),
  validate({ params: invoiceIdParamsSchema, body: transitionBodySchema }),
  idempotency("invoice.view", idempotencyRepo),
  (c) => viewInvoiceController(c),
);

invoiceRoutes.post(
  ApiContract.routes.invoiceApprove,
  requireAuthentication(),
  requireAnyPermission(Permissions.Invoice.ApproveOwn),
  validate({ params: invoiceIdParamsSchema, body: transitionBodySchema }),
  idempotency("invoice.approve", idempotencyRepo),
  (c) => approveInvoiceController(c),
);

invoiceRoutes.get(
  ApiContract.routes.payments,
  requireAuthentication(),
  requireAnyPermission(Permissions.Payment.ReadOwn),
  validate({ query: listPaymentsQuerySchema }),
  (c) => listPaymentsController(c),
);

invoiceRoutes.get(
  ApiContract.routes.paymentById,
  requireAuthentication(),
  validate({ params: paymentIdParamsSchema }),
  (c) => getPaymentController(c),
);

invoiceRoutes.get(
  ApiContract.routes.invoicePayments,
  requireAuthentication(),
  validate({ params: invoiceIdParamsSchema }),
  (c) => listInvoicePaymentsController(c),
);

invoiceRoutes.get(
  ApiContract.routes.businessInvoices,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessInvoice.Read),
  validate({
    params: businessIdParamsSchema,
    query: listBusinessInvoicesQuerySchema,
  }),
  (c) => listBusinessInvoicesController(c),
);

invoiceRoutes.post(
  ApiContract.routes.businessInvoices,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessInvoice.Create),
  validate({ params: businessIdParamsSchema, body: createInvoiceSchema }),
  idempotency("invoice.create", idempotencyRepo),
  (c) => createBusinessInvoiceController(c),
);

invoiceRoutes.get(
  ApiContract.routes.businessInvoiceById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessInvoice.Read),
  validate({ params: businessInvoiceParamsSchema }),
  (c) => getBusinessInvoiceController(c),
);

invoiceRoutes.patch(
  ApiContract.routes.businessInvoiceById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessInvoice.Update),
  validate({ params: businessInvoiceParamsSchema, body: updateInvoiceSchema }),
  (c) => updateBusinessInvoiceController(c),
);

invoiceRoutes.post(
  ApiContract.routes.businessInvoiceIssue,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessInvoice.Issue),
  validate({ params: businessInvoiceParamsSchema, body: transitionBodySchema }),
  idempotency("invoice.issue", idempotencyRepo),
  (c) => issueBusinessInvoiceController(c),
);

invoiceRoutes.post(
  ApiContract.routes.businessInvoiceCancel,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessInvoice.Cancel),
  validate({ params: businessInvoiceParamsSchema, body: transitionBodySchema }),
  idempotency("invoice.cancel", idempotencyRepo),
  (c) => cancelBusinessInvoiceController(c),
);

invoiceRoutes.post(
  ApiContract.routes.businessQuotationInvoice,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessInvoice.Create),
  validate({
    params: quotationInvoiceParamsSchema,
    body: createFromQuotationSchema,
  }),
  idempotency("invoice.create_from_quotation", idempotencyRepo),
  (c) => createQuotationInvoiceController(c),
);

invoiceRoutes.post(
  ApiContract.routes.businessAppointmentInvoice,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessInvoice.Create),
  validate({
    params: appointmentInvoiceParamsSchema,
    body: createFromAppointmentSchema,
  }),
  idempotency("invoice.create_from_appointment", idempotencyRepo),
  (c) => createAppointmentInvoiceController(c),
);

invoiceRoutes.get(
  ApiContract.routes.businessPayments,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessPayment.Read),
  validate({
    params: businessIdParamsSchema,
    query: listBusinessPaymentsQuerySchema,
  }),
  (c) => listBusinessPaymentsController(c),
);

invoiceRoutes.get(
  ApiContract.routes.businessInvoicePayments,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessPayment.Read),
  validate({ params: businessInvoiceParamsSchema }),
  (c) => listBusinessInvoicePaymentsController(c),
);

invoiceRoutes.post(
  ApiContract.routes.businessInvoiceCashPayment,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.BusinessPayment.RecordCash),
  validate({
    params: businessInvoiceParamsSchema,
    body: recordCashPaymentSchema,
  }),
  idempotency("payment.record_cash", idempotencyRepo),
  (c) => recordCashPaymentController(c),
);
