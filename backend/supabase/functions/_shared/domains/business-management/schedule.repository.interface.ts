import type {
  ClosureDateRecord,
  CreateClosureDatePersistenceInput,
  OpeningHoursRecord,
  OpeningHoursUpsertInput,
  UpdateClosureDatePersistenceInput,
} from "./business.types.ts";

export interface ScheduleRepository {
  listOpeningHours(
    businessId: string,
    branchId?: string | null,
  ): Promise<OpeningHoursRecord[]>;
  replaceOpeningHours(
    businessId: string,
    branchId: string | null,
    schedule: OpeningHoursUpsertInput[],
  ): Promise<OpeningHoursRecord[]>;
  listClosureDates(
    businessId: string,
    filters?: { branchId?: string; from?: string; to?: string },
  ): Promise<ClosureDateRecord[]>;
  createClosureDate(
    businessId: string,
    input: CreateClosureDatePersistenceInput,
  ): Promise<ClosureDateRecord>;
  updateClosureDate(
    businessId: string,
    closureId: string,
    input: UpdateClosureDatePersistenceInput,
  ): Promise<ClosureDateRecord>;
  deleteClosureDate(businessId: string, closureId: string): Promise<void>;
}
