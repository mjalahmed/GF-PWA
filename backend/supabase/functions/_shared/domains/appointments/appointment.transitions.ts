import {
  AppointmentStatuses,
  type AppointmentStatus,
} from "../../core/constants/statuses.ts";
import { InvalidStateTransitionError } from "../../core/errors/app-error.ts";

/** Allowed transitions: from -> set of to */
export const APPOINTMENT_TRANSITIONS: Record<
  AppointmentStatus,
  readonly AppointmentStatus[]
> = {
  [AppointmentStatuses.Requested]: [
    AppointmentStatuses.Confirmed,
    AppointmentStatuses.Rejected,
    AppointmentStatuses.CancelledByCustomer,
    AppointmentStatuses.CancelledByBusiness,
    AppointmentStatuses.Expired,
  ],
  [AppointmentStatuses.Confirmed]: [
    AppointmentStatuses.CustomerArrived,
    AppointmentStatuses.InProgress,
    AppointmentStatuses.CancelledByCustomer,
    AppointmentStatuses.CancelledByBusiness,
    AppointmentStatuses.NoShow,
    AppointmentStatuses.Expired,
  ],
  [AppointmentStatuses.CustomerArrived]: [
    AppointmentStatuses.InProgress,
    AppointmentStatuses.CancelledByBusiness,
    AppointmentStatuses.NoShow,
  ],
  [AppointmentStatuses.InProgress]: [
    AppointmentStatuses.Completed,
    AppointmentStatuses.CancelledByBusiness,
  ],
  [AppointmentStatuses.Rejected]: [],
  [AppointmentStatuses.Completed]: [],
  [AppointmentStatuses.CancelledByCustomer]: [],
  [AppointmentStatuses.CancelledByBusiness]: [],
  [AppointmentStatuses.NoShow]: [],
  [AppointmentStatuses.Expired]: [],
};

export function assertTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): void {
  const allowed = APPOINTMENT_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new InvalidStateTransitionError(
      `Cannot transition appointment from '${from}' to '${to}'.`,
      { from, to },
    );
  }
}

export function isTerminalStatus(status: AppointmentStatus): boolean {
  return (APPOINTMENT_TRANSITIONS[status] ?? []).length === 0;
}
