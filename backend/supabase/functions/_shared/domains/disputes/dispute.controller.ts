import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { DisputeStatus } from "../../core/constants/statuses.ts";
import { DisputeNotFoundError } from "./dispute.errors.ts";
import type {
  BusinessDisputeParamsDto,
  BusinessIdParamsDto,
  CreateBusinessDisputeRequestDto,
  CreateCustomerDisputeRequestDto,
  DisputeAssignRequestDto,
  DisputeCloseRequestDto,
  DisputeEvidenceRequestDto,
  DisputeIdParamsDto,
  DisputeInternalMessageRequestDto,
  DisputeMessageRequestDto,
  DisputeRejectRequestDto,
  DisputeResolveRequestDto,
  DisputeTransitionRequestDto,
  ListAdminDisputesQueryDto,
  ListDisputesQueryDto,
} from "./dispute.schemas.ts";

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

function normalizeStatus(
  status: string | string[] | undefined,
): DisputeStatus | DisputeStatus[] | undefined {
  if (!status) return undefined;
  if (Array.isArray(status)) return status as DisputeStatus[];
  return status as DisputeStatus;
}

export async function listCustomerDisputesController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ?? {}) as ListDisputesQueryDto;
  const { disputeService } = createRequestDependencies(c);
  const result = await disputeService.listCustomerDisputes(actorFrom(c), {
    status: normalizeStatus(query.status as string | string[] | undefined),
    page: query.page,
    pageSize: query.pageSize,
  });
  return successResponse(c, result.items, 200, result.pagination);
}

export async function createCustomerDisputeController(c: AppContext) {
  const body = (c.get("validatedBody" as never) ??
    {}) as CreateCustomerDisputeRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.createCustomerDispute(
    actorFrom(c),
    body,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}

export async function getCustomerDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.getDispute(actorFrom(c), disputeId);
  return successResponse(c, item);
}

export async function addCustomerDisputeMessageController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as DisputeMessageRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.addCustomerMessage(
    actorFrom(c),
    disputeId,
    body,
  );
  return successResponse(c, item, 201);
}

export async function addCustomerDisputeEvidenceController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as DisputeEvidenceRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.addCustomerEvidence(
    actorFrom(c),
    disputeId,
    body,
  );
  return successResponse(c, item, 201);
}

export async function withdrawCustomerDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.withdrawDispute(
    actorFrom(c),
    disputeId,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function listBusinessDisputesController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ?? {}) as ListDisputesQueryDto;
  const { disputeService } = createRequestDependencies(c);
  const result = await disputeService.listBusinessDisputes(actorFrom(c), businessId, {
    status: normalizeStatus(query.status as string | string[] | undefined),
    page: query.page,
    pageSize: query.pageSize,
  });
  return successResponse(c, result.items, 200, result.pagination);
}

export async function createBusinessDisputeController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as CreateBusinessDisputeRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.createBusinessDispute(
    actorFrom(c),
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}

export async function getBusinessDisputeController(c: AppContext) {
  const { businessId, disputeId } = (c.get("validatedParams" as never) ??
    {}) as BusinessDisputeParamsDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.getDispute(actorFrom(c), disputeId);
  if (item.businessId !== businessId) {
    throw new DisputeNotFoundError(disputeId);
  }
  return successResponse(c, item);
}

export async function addBusinessDisputeMessageController(c: AppContext) {
  const { businessId, disputeId } = (c.get("validatedParams" as never) ??
    {}) as BusinessDisputeParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as DisputeMessageRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.addBusinessMessage(
    actorFrom(c),
    businessId,
    disputeId,
    body,
  );
  return successResponse(c, item, 201);
}

export async function addBusinessDisputeEvidenceController(c: AppContext) {
  const { businessId, disputeId } = (c.get("validatedParams" as never) ??
    {}) as BusinessDisputeParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as DisputeEvidenceRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.addBusinessEvidence(
    actorFrom(c),
    businessId,
    disputeId,
    body,
  );
  return successResponse(c, item, 201);
}

export async function listAdminDisputesController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListAdminDisputesQueryDto;
  const { disputeService } = createRequestDependencies(c);
  const result = await disputeService.listAdminDisputes(actorFrom(c), {
    customerId: query.customerId,
    businessId: query.businessId,
    assignedAdminId: query.assignedAdminId,
    status: normalizeStatus(query.status as string | string[] | undefined),
    page: query.page,
    pageSize: query.pageSize,
  });
  return successResponse(c, result.items, 200, result.pagination);
}

export async function getAdminDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.getDispute(actorFrom(c), disputeId);
  return successResponse(c, item);
}

export async function assignAdminDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as DisputeAssignRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.assignDispute(
    actorFrom(c),
    disputeId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function requestCustomerDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as DisputeTransitionRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.requestCustomerResponse(
    actorFrom(c),
    disputeId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function requestBusinessDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as DisputeTransitionRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.requestBusinessResponse(
    actorFrom(c),
    disputeId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function startReviewDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as DisputeTransitionRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.startReview(
    actorFrom(c),
    disputeId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function resolveAdminDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as DisputeResolveRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.resolveDispute(
    actorFrom(c),
    disputeId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function rejectAdminDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as DisputeRejectRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.rejectDispute(
    actorFrom(c),
    disputeId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function closeAdminDisputeController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as DisputeCloseRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.closeDispute(
    actorFrom(c),
    disputeId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function addAdminInternalMessageController(c: AppContext) {
  const { disputeId } = (c.get("validatedParams" as never) ??
    {}) as DisputeIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as DisputeInternalMessageRequestDto;
  const { disputeService } = createRequestDependencies(c);
  const item = await disputeService.addInternalMessage(actorFrom(c), disputeId, body);
  return successResponse(c, item, 201);
}
