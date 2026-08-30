import type {
  AppointmentRecord,
  CreateAppointmentPersistenceInput,
  ListAppointmentsFilters,
  OverlapQuery,
  TransitionPersistenceInput,
} from "./appointment.types.ts";

export interface AppointmentRepository {
  findById(
    appointmentId: string,
    options?: { includeHistory?: boolean },
  ): Promise<AppointmentRecord | null>;
  list(filters: ListAppointmentsFilters): Promise<AppointmentRecord[]>;
  listOverlapping(query: OverlapQuery): Promise<AppointmentRecord[]>;
  create(input: CreateAppointmentPersistenceInput): Promise<AppointmentRecord>;
  transition(input: TransitionPersistenceInput): Promise<AppointmentRecord>;
}
