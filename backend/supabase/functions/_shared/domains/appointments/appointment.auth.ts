import {
  isPlatformBusinessOperator,
  permissionsForMembershipRole,
} from "../../core/auth/business-authorization.middleware.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import type { MembershipRole } from "../business-management/business.types.ts";

export const APPOINTMENT_TRANSITION_PERMISSION = {
  confirm: Permissions.Appointment.Confirm,
  reject: Permissions.Appointment.Reject,
  cancel: Permissions.Appointment.Cancel,
  arrive: Permissions.Appointment.Arrive,
  start: Permissions.Appointment.Start,
  complete: Permissions.Appointment.Complete,
  no_show: Permissions.Appointment.NoShow,
} as const;

export type AppointmentTransitionAction =
  keyof typeof APPOINTMENT_TRANSITION_PERMISSION;

/**
 * Business appointment transitions require an active membership whose role
 * holds the transition permission. admin and super_admin are the only
 * global bypass. A global appointment.confirm or appointment.manage grant
 * does not authorize the action.
 */
export function membershipCanPerformAppointmentTransition(input: {
  roles?: string[];
  membershipRole: MembershipRole | null;
  action: AppointmentTransitionAction;
}): boolean {
  if (isPlatformBusinessOperator(input.roles ?? [])) return true;
  if (!input.membershipRole) return false;
  return permissionsForMembershipRole(input.membershipRole).includes(
    APPOINTMENT_TRANSITION_PERMISSION[input.action],
  );
}
