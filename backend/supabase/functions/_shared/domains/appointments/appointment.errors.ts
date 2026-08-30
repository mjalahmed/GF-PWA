import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../core/errors/app-error.ts";

export class AppointmentNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Appointment was not found.", id ? { appointmentId: id } : null);
    this.name = "AppointmentNotFoundError";
  }
}

export class AppointmentAccessDeniedError extends AuthorizationError {
  constructor(message = "You do not have access to this appointment.") {
    super(message);
    this.name = "AppointmentAccessDeniedError";
  }
}

export class AppointmentConflictError extends ConflictError {
  constructor(message = "The selected time conflicts with another appointment.") {
    super("APPOINTMENT_CONFLICT", message);
    this.name = "AppointmentConflictError";
  }
}

export class AppointmentsDisabledError extends ValidationError {
  constructor() {
    super("Appointments are disabled for this business.");
    this.name = "AppointmentsDisabledError";
  }
}

export class AppointmentOutsideHoursError extends ValidationError {
  constructor(message = "The selected time is outside opening hours.") {
    super(message);
    this.name = "AppointmentOutsideHoursError";
  }
}

export class AppointmentNoticeError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = "AppointmentNoticeError";
  }
}

export class AppointmentCancellationNoticeError extends ValidationError {
  constructor() {
    super("Cancellation notice period has passed for this appointment.");
    this.name = "AppointmentCancellationNoticeError";
  }
}
