import type {
  BusinessMembershipRecord,
  BusinessRecord,
  BusinessSettingsRecord,
  NotificationInsertInput,
  UpdateBusinessPersistenceInput,
  UpdateBusinessSettingsPersistenceInput,
} from "./business.types.ts";

export interface BusinessRepository {
  findById(id: string, client?: "user" | "admin"): Promise<BusinessRecord | null>;
  findPublicById(id: string): Promise<BusinessRecord | null>;
  updateFields(
    id: string,
    input: UpdateBusinessPersistenceInput,
  ): Promise<BusinessRecord>;
  findSettings(
    businessId: string,
    client?: "user" | "admin",
  ): Promise<BusinessSettingsRecord | null>;
  updateSettings(
    businessId: string,
    input: UpdateBusinessSettingsPersistenceInput,
  ): Promise<BusinessSettingsRecord>;
  findActiveMembership(
    businessId: string,
    userId: string,
  ): Promise<BusinessMembershipRecord | null>;
  listActiveMembershipsForUser(
    userId: string,
  ): Promise<Array<{ membership: BusinessMembershipRecord; business: BusinessRecord }>>;
  countActiveOwners(businessId: string): Promise<number>;
  insertNotification(input: NotificationInsertInput): Promise<void>;
}
