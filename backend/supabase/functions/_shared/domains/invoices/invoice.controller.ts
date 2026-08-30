import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { InvoiceStatus } from "../../core/constants/statuses.ts";
import type {
  AppointmentInvoiceParamsDto,
  BusinessIdParamsDto,
  BusinessInvoiceParamsDto,
  CreateFromAppointmentRequestDto,
  CreateFromQuotationRequestDto,
  CreateInvoiceRequestDto,
  InvoiceIdParamsDto,
  ListBusinessInvoicesQueryDto,
  ListBusinessPaymentsQueryDto,
  ListInvoicesQueryDto,
  ListPaymentsQueryDto,
  PaymentIdParamsDto,
  QuotationInvoiceParamsDto,
  RecordCashPaymentRequestDto,
  TransitionBodyDto,
  UpdateInvoiceRequestDto,
} from "./invoice.schemas.ts";

function actorFrom(c: AppContext) {
  return {
    userId: c.get("userId")!,
    roles: (c.get("roles") ?? []) as string[],
    globalPermissions: (c.get("permissions") ?? []) as string[],
  };
}

function normalizeStatus(
  status: string | string[] | undefined,
): InvoiceStatus | InvoiceStatus[] | undefined {
  if (!status) return undefined;
  if (Array.isArray(status)) return status as InvoiceStatus[];
  return status as InvoiceStatus;
}

function transitionBody(c: AppContext): TransitionBodyDto {
  return (c.get("validatedBody" as never) ?? {}) as TransitionBodyDto;
}

export async function listInvoicesController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ?? {}) as ListInvoicesQueryDto;
  const { invoiceService } = createRequestDependencies(c);
  const items = await invoiceService.listForActor(actorFrom(c), {
    status: normalizeStatus(query.status as string | string[] | undefined),
    from: query.from,
    to: query.to,
    businessId: query.businessId,
  });
  return successResponse(c, items);
}

export async function getInvoiceController(c: AppContext) {
  const { invoiceId } = (c.get("validatedParams" as never) ??
    {}) as InvoiceIdParamsDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.getById(actorFrom(c), invoiceId);
  return successResponse(c, item);
}

export async function viewInvoiceController(c: AppContext) {
  const { invoiceId } = (c.get("validatedParams" as never) ??
    {}) as InvoiceIdParamsDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.view(
    actorFrom(c),
    invoiceId,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function approveInvoiceController(c: AppContext) {
  const { invoiceId } = (c.get("validatedParams" as never) ??
    {}) as InvoiceIdParamsDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.approve(
    actorFrom(c),
    invoiceId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function listBusinessInvoicesController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListBusinessInvoicesQueryDto;
  const { invoiceService } = createRequestDependencies(c);
  const items = await invoiceService.listForBusiness(
    businessId,
    actorFrom(c),
    {
      status: normalizeStatus(query.status as string | string[] | undefined),
      from: query.from,
      to: query.to,
      customerId: query.customerId,
    },
  );
  return successResponse(c, items);
}

export async function createBusinessInvoiceController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as CreateInvoiceRequestDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.create(
    actorFrom(c),
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}

export async function getBusinessInvoiceController(c: AppContext) {
  const { invoiceId } = (c.get("validatedParams" as never) ??
    {}) as BusinessInvoiceParamsDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.getById(actorFrom(c), invoiceId);
  return successResponse(c, item);
}

export async function updateBusinessInvoiceController(c: AppContext) {
  const { businessId, invoiceId } = (c.get("validatedParams" as never) ??
    {}) as BusinessInvoiceParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as UpdateInvoiceRequestDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.updateDraft(
    actorFrom(c),
    businessId,
    invoiceId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function issueBusinessInvoiceController(c: AppContext) {
  const { businessId, invoiceId } = (c.get("validatedParams" as never) ??
    {}) as BusinessInvoiceParamsDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.issue(
    actorFrom(c),
    businessId,
    invoiceId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function cancelBusinessInvoiceController(c: AppContext) {
  const { businessId, invoiceId } = (c.get("validatedParams" as never) ??
    {}) as BusinessInvoiceParamsDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.cancel(
    actorFrom(c),
    businessId,
    invoiceId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function createQuotationInvoiceController(c: AppContext) {
  const { businessId, quotationId } = (c.get("validatedParams" as never) ??
    {}) as QuotationInvoiceParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as CreateFromQuotationRequestDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.createFromQuotation(
    actorFrom(c),
    businessId,
    quotationId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}

export async function createAppointmentInvoiceController(c: AppContext) {
  const { businessId, appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentInvoiceParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as CreateFromAppointmentRequestDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.createFromAppointment(
    actorFrom(c),
    businessId,
    appointmentId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}

export async function listPaymentsController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ?? {}) as ListPaymentsQueryDto;
  const { invoiceService } = createRequestDependencies(c);
  const items = await invoiceService.listPaymentsForActor(actorFrom(c), {
    from: query.from,
    to: query.to,
    invoiceId: query.invoiceId,
  });
  return successResponse(c, items);
}

export async function getPaymentController(c: AppContext) {
  const { paymentId } = (c.get("validatedParams" as never) ??
    {}) as PaymentIdParamsDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.getPayment(actorFrom(c), paymentId);
  return successResponse(c, item);
}

export async function listInvoicePaymentsController(c: AppContext) {
  const { invoiceId } = (c.get("validatedParams" as never) ??
    {}) as InvoiceIdParamsDto;
  const { invoiceService } = createRequestDependencies(c);
  const items = await invoiceService.listPaymentsForInvoice(
    actorFrom(c),
    invoiceId,
  );
  return successResponse(c, items);
}

export async function listBusinessPaymentsController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListBusinessPaymentsQueryDto;
  const { invoiceService } = createRequestDependencies(c);
  const items = await invoiceService.listPaymentsForBusiness(
    businessId,
    actorFrom(c),
    {
      from: query.from,
      to: query.to,
      invoiceId: query.invoiceId,
      customerId: query.customerId,
    },
  );
  return successResponse(c, items);
}

export async function listBusinessInvoicePaymentsController(c: AppContext) {
  const { invoiceId } = (c.get("validatedParams" as never) ??
    {}) as BusinessInvoiceParamsDto;
  const { invoiceService } = createRequestDependencies(c);
  const items = await invoiceService.listPaymentsForInvoice(
    actorFrom(c),
    invoiceId,
  );
  return successResponse(c, items);
}

export async function recordCashPaymentController(c: AppContext) {
  const { businessId, invoiceId } = (c.get("validatedParams" as never) ??
    {}) as BusinessInvoiceParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as RecordCashPaymentRequestDto;
  const { invoiceService } = createRequestDependencies(c);
  const item = await invoiceService.recordCashPayment(
    actorFrom(c),
    businessId,
    invoiceId,
    body,
    c.get("requestId"),
    c.req.header("Idempotency-Key") ?? undefined,
  );
  return successResponse(c, item, 201);
}
