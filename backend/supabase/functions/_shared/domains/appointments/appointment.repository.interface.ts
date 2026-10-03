import type {
  AppointmentMediaRecord,
  AppointmentRecord,
  CreateAppointmentPersistenceInput,
  InsertAppointmentMediaInput,
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
  existsForCustomerBusiness(
    customerId: string,
    businessId: string,
  ): Promise<boolean>;
  listMedia(appointmentId: string): Promise<AppointmentMediaRecord[]>;
  insertMedia(input: InsertAppointmentMediaInput): Promise<AppointmentMediaRecord>;
}
