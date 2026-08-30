import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { QuotationStatus } from "../../core/constants/statuses.ts";
import type {
  AppointmentQuotationParamsDto,
  BusinessIdParamsDto,
  BusinessQuotationParamsDto,
  CreateFromAppointmentRequestDto,
  CreateQuotationRequestDto,
  ListBusinessQuotationsQueryDto,
  ListQuotationsQueryDto,
  QuotationIdParamsDto,
  TransitionBodyDto,
  UpdateQuotationRequestDto,
} from "./quotation.schemas.ts";

function actorFrom(c: AppContext) {
  return {
    userId: c.get("userId")!,
    roles: (c.get("roles") ?? []) as string[],
    globalPermissions: (c.get("permissions") ?? []) as string[],
  };
}

function normalizeStatus(
  status: string | string[] | undefined,
): QuotationStatus | QuotationStatus[] | undefined {
  if (!status) return undefined;
  if (Array.isArray(status)) return status as QuotationStatus[];
  return status as QuotationStatus;
}

function transitionBody(c: AppContext): TransitionBodyDto {
  return (c.get("validatedBody" as never) ?? {}) as TransitionBodyDto;
}

export async function listQuotationsController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ?? {}) as ListQuotationsQueryDto;
  const { quotationService } = createRequestDependencies(c);
  const items = await quotationService.listForActor(actorFrom(c), {
    status: normalizeStatus(query.status as string | string[] | undefined),
    from: query.from,
    to: query.to,
    businessId: query.businessId,
  });
  return successResponse(c, items);
}

export async function getQuotationController(c: AppContext) {
  const { quotationId } = (c.get("validatedParams" as never) ??
    {}) as QuotationIdParamsDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.getById(actorFrom(c), quotationId);
  return successResponse(c, item);
}

export async function viewQuotationController(c: AppContext) {
  const { quotationId } = (c.get("validatedParams" as never) ??
    {}) as QuotationIdParamsDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.view(
    actorFrom(c),
    quotationId,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function acceptQuotationController(c: AppContext) {
  const { quotationId } = (c.get("validatedParams" as never) ??
    {}) as QuotationIdParamsDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.accept(
    actorFrom(c),
    quotationId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function rejectQuotationController(c: AppContext) {
  const { quotationId } = (c.get("validatedParams" as never) ??
    {}) as QuotationIdParamsDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.reject(
    actorFrom(c),
    quotationId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function listBusinessQuotationsController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListBusinessQuotationsQueryDto;
  const { quotationService } = createRequestDependencies(c);
  const items = await quotationService.listForBusiness(
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

export async function createBusinessQuotationController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as CreateQuotationRequestDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.create(
    actorFrom(c),
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}

export async function getBusinessQuotationController(c: AppContext) {
  const { quotationId } = (c.get("validatedParams" as never) ??
    {}) as BusinessQuotationParamsDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.getById(actorFrom(c), quotationId);
  return successResponse(c, item);
}

export async function updateBusinessQuotationController(c: AppContext) {
  const { businessId, quotationId } = (c.get("validatedParams" as never) ??
    {}) as BusinessQuotationParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as UpdateQuotationRequestDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.updateDraft(
    actorFrom(c),
    businessId,
    quotationId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function issueBusinessQuotationController(c: AppContext) {
  const { businessId, quotationId } = (c.get("validatedParams" as never) ??
    {}) as BusinessQuotationParamsDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.issue(
    actorFrom(c),
    businessId,
    quotationId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function reviseBusinessQuotationController(c: AppContext) {
  const { businessId, quotationId } = (c.get("validatedParams" as never) ??
    {}) as BusinessQuotationParamsDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.revise(
    actorFrom(c),
    businessId,
    quotationId,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}

export async function cancelBusinessQuotationController(c: AppContext) {
  const { businessId, quotationId } = (c.get("validatedParams" as never) ??
    {}) as BusinessQuotationParamsDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.cancel(
    actorFrom(c),
    businessId,
    quotationId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function createAppointmentQuotationController(c: AppContext) {
  const { businessId, appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentQuotationParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as CreateFromAppointmentRequestDto;
  const { quotationService } = createRequestDependencies(c);
  const item = await quotationService.createFromAppointment(
    actorFrom(c),
    businessId,
    appointmentId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}
