import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { AppointmentStatus } from "../../core/constants/statuses.ts";
import type {
  AppointmentIdParamsDto,
  AppointmentSlotsQueryDto,
  BranchSlotsParamsDto,
  BusinessIdParamsDto,
  CreateAppointmentRequestDto,
  ListAppointmentsQueryDto,
  ListBusinessAppointmentsQueryDto,
  TransitionBodyDto,
} from "./appointment.schemas.ts";

function actorFrom(c: AppContext) {
  return {
    userId: c.get("userId")!,
    roles: (c.get("roles") ?? []) as string[],
    globalPermissions: (c.get("permissions") ?? []) as string[],
  };
}

function normalizeStatus(
  status: string | string[] | undefined,
): AppointmentStatus | AppointmentStatus[] | undefined {
  if (!status) return undefined;
  if (Array.isArray(status)) return status as AppointmentStatus[];
  return status as AppointmentStatus;
}

export async function listAppointmentsController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ?? {}) as ListAppointmentsQueryDto;
  const { appointmentService } = createRequestDependencies(c);
  const items = await appointmentService.listForActor(actorFrom(c), {
    status: normalizeStatus(query.status as string | string[] | undefined),
    from: query.from,
    to: query.to,
    businessId: query.businessId,
  });
  return successResponse(c, items);
}

export async function createAppointmentController(c: AppContext) {
  const body = (c.get("validatedBody" as never) ?? {}) as CreateAppointmentRequestDto;
  const { appointmentService } = createRequestDependencies(c);
  const item = await appointmentService.create(
    actorFrom(c),
    body,
    c.get("requestId"),
  );
  return successResponse(c, item, 201);
}

export async function getAppointmentController(c: AppContext) {
  const { appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentIdParamsDto;
  const { appointmentService } = createRequestDependencies(c);
  const item = await appointmentService.getById(actorFrom(c), appointmentId);
  return successResponse(c, item);
}

export async function listBusinessAppointmentsController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListBusinessAppointmentsQueryDto;
  const { appointmentService } = createRequestDependencies(c);
  const items = await appointmentService.listForBusiness(businessId, {
    status: normalizeStatus(query.status as string | string[] | undefined),
    from: query.from,
    to: query.to,
    branchId: query.branchId,
  });
  return successResponse(c, items);
}

export async function listAppointmentSlotsController(c: AppContext) {
  const { businessId, branchId } = (c.get("validatedParams" as never) ??
    {}) as BranchSlotsParamsDto;
  const query = (c.get("validatedQuery" as never) ??
    {}) as AppointmentSlotsQueryDto;
  const { appointmentService } = createRequestDependencies(c);
  const slots = await appointmentService.listSlots(
    businessId,
    branchId,
    query.date,
    query.serviceId,
  );
  return successResponse(c, slots);
}

function transitionBody(c: AppContext): TransitionBodyDto {
  return (c.get("validatedBody" as never) ?? {}) as TransitionBodyDto;
}

export async function confirmAppointmentController(c: AppContext) {
  const { appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentIdParamsDto;
  const { appointmentService } = createRequestDependencies(c);
  const item = await appointmentService.confirm(
    actorFrom(c),
    appointmentId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function rejectAppointmentController(c: AppContext) {
  const { appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentIdParamsDto;
  const { appointmentService } = createRequestDependencies(c);
  const item = await appointmentService.reject(
    actorFrom(c),
    appointmentId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function cancelAppointmentController(c: AppContext) {
  const { appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentIdParamsDto;
  const { appointmentService } = createRequestDependencies(c);
  const item = await appointmentService.cancel(
    actorFrom(c),
    appointmentId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function arriveAppointmentController(c: AppContext) {
  const { appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentIdParamsDto;
  const { appointmentService } = createRequestDependencies(c);
  const item = await appointmentService.arrive(
    actorFrom(c),
    appointmentId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function startAppointmentController(c: AppContext) {
  const { appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentIdParamsDto;
  const { appointmentService } = createRequestDependencies(c);
  const item = await appointmentService.start(
    actorFrom(c),
    appointmentId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function completeAppointmentController(c: AppContext) {
  const { appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentIdParamsDto;
  const { appointmentService } = createRequestDependencies(c);
  const item = await appointmentService.complete(
    actorFrom(c),
    appointmentId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}

export async function noShowAppointmentController(c: AppContext) {
  const { appointmentId } = (c.get("validatedParams" as never) ??
    {}) as AppointmentIdParamsDto;
  const { appointmentService } = createRequestDependencies(c);
  const item = await appointmentService.noShow(
    actorFrom(c),
    appointmentId,
    transitionBody(c),
    c.get("requestId"),
  );
  return successResponse(c, item);
}
