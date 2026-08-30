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
  appointmentIdParamsSchema,
  appointmentSlotsQuerySchema,
  branchSlotsParamsSchema,
  businessIdParamsSchema,
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  listBusinessAppointmentsQuerySchema,
  transitionBodySchema,
} from "./appointment.schemas.ts";
import {
  arriveAppointmentController,
  cancelAppointmentController,
  completeAppointmentController,
  confirmAppointmentController,
  createAppointmentController,
  getAppointmentController,
  listAppointmentSlotsController,
  listAppointmentsController,
  listBusinessAppointmentsController,
  noShowAppointmentController,
  rejectAppointmentController,
  startAppointmentController,
} from "./appointment.controller.ts";

export const appointmentRoutes = new Hono<{ Variables: AppVariables }>();

const idempotencyRepo = (c: { get: (k: keyof AppVariables) => unknown }) =>
  createRequestDependencies(c as never).idempotencyRepository;

appointmentRoutes.get(
  ApiContract.routes.appointments,
  requireAuthentication(),
  requireAnyPermission(Permissions.Appointment.Read, Permissions.Appointment.View),
  validate({ query: listAppointmentsQuerySchema }),
  (c) => listAppointmentsController(c),
);

appointmentRoutes.post(
  ApiContract.routes.appointments,
  requireAuthentication(),
  requireAnyPermission(Permissions.Appointment.Create),
  validate({ body: createAppointmentSchema }),
  idempotency("appointment.create", idempotencyRepo),
  (c) => createAppointmentController(c),
);

appointmentRoutes.get(
  ApiContract.routes.appointmentById,
  requireAuthentication(),
  validate({ params: appointmentIdParamsSchema }),
  (c) => getAppointmentController(c),
);

appointmentRoutes.get(
  ApiContract.routes.businessAppointments,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Appointment.Read),
  validate({
    params: businessIdParamsSchema,
    query: listBusinessAppointmentsQuerySchema,
  }),
  (c) => listBusinessAppointmentsController(c),
);

appointmentRoutes.get(
  ApiContract.routes.businessBranchAppointmentSlots,
  requireAuthentication(),
  validate({
    params: branchSlotsParamsSchema,
    query: appointmentSlotsQuerySchema,
  }),
  (c) => listAppointmentSlotsController(c),
);

// Transition routes: membership is checked in the service (no businessId in path).
appointmentRoutes.post(
  ApiContract.routes.appointmentConfirm,
  requireAuthentication(),
  validate({ params: appointmentIdParamsSchema, body: transitionBodySchema }),
  idempotency("appointment.confirm", idempotencyRepo),
  (c) => confirmAppointmentController(c),
);

appointmentRoutes.post(
  ApiContract.routes.appointmentReject,
  requireAuthentication(),
  validate({ params: appointmentIdParamsSchema, body: transitionBodySchema }),
  idempotency("appointment.reject", idempotencyRepo),
  (c) => rejectAppointmentController(c),
);

appointmentRoutes.post(
  ApiContract.routes.appointmentCancel,
  requireAuthentication(),
  validate({ params: appointmentIdParamsSchema, body: transitionBodySchema }),
  idempotency("appointment.cancel", idempotencyRepo),
  (c) => cancelAppointmentController(c),
);

appointmentRoutes.post(
  ApiContract.routes.appointmentArrive,
  requireAuthentication(),
  validate({ params: appointmentIdParamsSchema, body: transitionBodySchema }),
  idempotency("appointment.arrive", idempotencyRepo),
  (c) => arriveAppointmentController(c),
);

appointmentRoutes.post(
  ApiContract.routes.appointmentStart,
  requireAuthentication(),
  validate({ params: appointmentIdParamsSchema, body: transitionBodySchema }),
  idempotency("appointment.start", idempotencyRepo),
  (c) => startAppointmentController(c),
);

appointmentRoutes.post(
  ApiContract.routes.appointmentComplete,
  requireAuthentication(),
  validate({ params: appointmentIdParamsSchema, body: transitionBodySchema }),
  idempotency("appointment.complete", idempotencyRepo),
  (c) => completeAppointmentController(c),
);

appointmentRoutes.post(
  ApiContract.routes.appointmentNoShow,
  requireAuthentication(),
  validate({ params: appointmentIdParamsSchema, body: transitionBodySchema }),
  idempotency("appointment.no_show", idempotencyRepo),
  (c) => noShowAppointmentController(c),
);
