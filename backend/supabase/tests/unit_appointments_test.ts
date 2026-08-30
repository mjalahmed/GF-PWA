/**
 * Phase 6 appointments unit tests.
 */
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ApiContract } from "../functions/_shared/contracts/api-contract.ts";
import { Permissions } from "../functions/_shared/core/constants/permissions.ts";
import {
  AppointmentStatuses,
  AppointmentTerminalStatuses,
} from "../functions/_shared/core/constants/statuses.ts";
import { InvalidStateTransitionError } from "../functions/_shared/core/errors/app-error.ts";
import {
  APPOINTMENT_TRANSITIONS,
  assertTransition,
  isTerminalStatus,
} from "../functions/_shared/domains/appointments/appointment.transitions.ts";
import {
  generateCandidateSlots,
  isIntervalWithinOpenHours,
  rangesOverlap,
} from "../functions/_shared/domains/appointments/appointment.schedule.ts";
import { AppointmentMapper } from "../functions/_shared/domains/appointments/appointment.mapper.ts";
import type { AppointmentRecord } from "../functions/_shared/domains/appointments/appointment.types.ts";
import { createAppointmentSchema } from "../functions/_shared/domains/appointments/appointment.schemas.ts";

Deno.test("ApiContract exposes Phase 6 appointment routes", () => {
  assertEquals(ApiContract.routes.appointments, "/appointments");
  assertEquals(
    ApiContract.routes.appointmentConfirm,
    "/appointments/:appointmentId/confirm",
  );
  assertEquals(
    ApiContract.routes.appointmentNoShow,
    "/appointments/:appointmentId/no-show",
  );
  assertEquals(
    ApiContract.routes.businessAppointments,
    "/businesses/:businessId/appointments",
  );
  assertEquals(
    ApiContract.routes.businessBranchAppointmentSlots,
    "/businesses/:businessId/branches/:branchId/appointment-slots",
  );
});

Deno.test("Phase 6 appointment permission codes exist", () => {
  assertEquals(Permissions.Appointment.Read, "appointment.read");
  assertEquals(Permissions.Appointment.Create, "appointment.create");
  assertEquals(Permissions.Appointment.Confirm, "appointment.confirm");
  assertEquals(Permissions.Appointment.NoShow, "appointment.no_show");
});

Deno.test("AppointmentStatuses matches full program set", () => {
  assertEquals(AppointmentStatuses.Requested, "requested");
  assertEquals(AppointmentStatuses.CustomerArrived, "customer_arrived");
  assertEquals(AppointmentStatuses.CancelledByCustomer, "cancelled_by_customer");
  assertEquals(AppointmentStatuses.CancelledByBusiness, "cancelled_by_business");
  assertEquals(AppointmentStatuses.Expired, "expired");
  assertEquals(AppointmentTerminalStatuses.length, 6);
});

Deno.test("assertTransition allows happy path and rejects invalid", () => {
  assertTransition(
    AppointmentStatuses.Requested,
    AppointmentStatuses.Confirmed,
  );
  assertTransition(
    AppointmentStatuses.Confirmed,
    AppointmentStatuses.CustomerArrived,
  );
  assertTransition(
    AppointmentStatuses.InProgress,
    AppointmentStatuses.Completed,
  );
  assertThrows(
    () =>
      assertTransition(
        AppointmentStatuses.Requested,
        AppointmentStatuses.Completed,
      ),
    InvalidStateTransitionError,
  );
  assertThrows(
    () =>
      assertTransition(
        AppointmentStatuses.Completed,
        AppointmentStatuses.Confirmed,
      ),
    InvalidStateTransitionError,
  );
  assertEquals(isTerminalStatus(AppointmentStatuses.Completed), true);
  assertEquals(isTerminalStatus(AppointmentStatuses.Requested), false);
  assertEquals(
    APPOINTMENT_TRANSITIONS[AppointmentStatuses.Requested].includes(
      AppointmentStatuses.Rejected,
    ),
    true,
  );
});

Deno.test("rangesOverlap detects conflicts", () => {
  assertEquals(
    rangesOverlap(
      "2026-08-10T09:00:00.000Z",
      "2026-08-10T10:00:00.000Z",
      "2026-08-10T09:30:00.000Z",
      "2026-08-10T10:30:00.000Z",
    ),
    true,
  );
  assertEquals(
    rangesOverlap(
      "2026-08-10T09:00:00.000Z",
      "2026-08-10T10:00:00.000Z",
      "2026-08-10T10:00:00.000Z",
      "2026-08-10T11:00:00.000Z",
    ),
    false,
  );
});

Deno.test("isIntervalWithinOpenHours respects Bahrain hours and closures", () => {
  const hours = [{
    branchId: "b1",
    dayOfWeek: 1, // Monday
    opensAt: "09:00:00",
    closesAt: "17:00:00",
    isClosed: false,
  }];
  // Monday 2026-08-10 in Bahrain
  const start = new Date("2026-08-10T06:00:00.000Z"); // 09:00 +03
  const end = new Date("2026-08-10T07:00:00.000Z"); // 10:00 +03
  assertEquals(
    isIntervalWithinOpenHours("b1", start, end, hours, []),
    true,
  );
  assertEquals(
    isIntervalWithinOpenHours(
      "b1",
      new Date("2026-08-10T04:00:00.000Z"),
      new Date("2026-08-10T05:00:00.000Z"),
      hours,
      [],
    ),
    false,
  );
  assertEquals(
    isIntervalWithinOpenHours("b1", start, end, hours, [{
      branchId: "b1",
      closureDate: "2026-08-10",
      isFullDay: true,
      opensAt: null,
      closesAt: null,
    }]),
    false,
  );
});

Deno.test("generateCandidateSlots skips occupied and past notice", () => {
  const hours = [{
    branchId: "b1",
    dayOfWeek: 1,
    opensAt: "09:00:00",
    closesAt: "12:00:00",
    isClosed: false,
  }];
  const slots = generateCandidateSlots({
    dateStr: "2026-08-10",
    branchId: "b1",
    durationMinutes: 60,
    openingHours: hours,
    closureDates: [],
    occupied: [{
      start: "2026-08-10T06:00:00.000Z",
      end: "2026-08-10T07:00:00.000Z",
    }],
    now: new Date("2026-08-01T00:00:00.000Z"),
    minimumNoticeMinutes: 0,
  });
  assertEquals(slots.length > 0, true);
  assertEquals(
    slots.every((s) => s.start !== "2026-08-10T06:00:00.000Z"),
    true,
  );
});

Deno.test("AppointmentMapper maps records to DTOs", () => {
  const record: AppointmentRecord = {
    id: "a1",
    customerId: "c1",
    businessId: "biz1",
    branchId: "br1",
    vehicleId: null,
    status: AppointmentStatuses.Requested,
    scheduledStart: "2026-08-10T06:00:00.000Z",
    scheduledEnd: "2026-08-10T07:00:00.000Z",
    customerNotes: "hi",
    businessNotes: null,
    cancellationReason: null,
    cancelledBy: null,
    confirmedAt: null,
    arrivedAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    services: [{
      id: "as1",
      appointmentId: "a1",
      serviceId: "s1",
      serviceNameSnapshot: "Oil Change",
      estimatedDurationMinutes: 60,
      quotedPrice: 10,
      createdAt: "2026-08-01T00:00:00.000Z",
    }],
  };
  const dto = AppointmentMapper.toDto(record);
  assertEquals(dto.services[0].serviceName, "Oil Change");
  assertEquals(dto.status, "requested");
});

Deno.test("createAppointmentSchema validates payload", () => {
  const parsed = createAppointmentSchema.parse({
    businessId: "11111111-1111-1111-1111-111111111111",
    branchId: "22222222-2222-2222-2222-222222222222",
    serviceId: "33333333-3333-3333-3333-333333333333",
    scheduledStart: "2026-08-10T06:00:00.000Z",
  });
  assertEquals(parsed.serviceId, "33333333-3333-3333-3333-333333333333");
});
