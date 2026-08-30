import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import type { BusinessRepository } from "./business.repository.interface.ts";
import type {
  BusinessMembershipRecord,
  BusinessRecord,
  BusinessSettingsRecord,
  MembershipRole,
  NotificationInsertInput,
  UpdateBusinessPersistenceInput,
  UpdateBusinessSettingsPersistenceInput,
} from "./business.types.ts";

type BusinessRow = {
  id: string;
  slug: string;
  business_category_id: string;
  legal_name: string;
  display_name: string;
  description: string | null;
  commercial_registration_number: string | null;
  phone: string;
  email: string;
  website: string | null;
  status: string;
  verification_status: string;
  source_application_id: string | null;
  logo_path: string | null;
  cover_path: string | null;
  average_rating: number;
  rating_count: number;
  approved_at: string | null;
  approved_by: string | null;
  suspended_at: string | null;
  suspended_reason: string | null;
  closed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type SettingsRow = {
  id: string;
  business_id: string;
  appointments_enabled: boolean;
  products_enabled: boolean;
  quotations_enabled: boolean;
  invoices_enabled: boolean;
  cash_payments_enabled: boolean;
  online_payments_enabled: boolean;
  reviews_enabled: boolean;
  auto_confirm_appointments: boolean;
  default_appointment_duration_minutes: number | null;
  minimum_booking_notice_minutes: number | null;
  maximum_booking_days_ahead: number | null;
  cancellation_notice_minutes: number | null;
  currency: string;
  locale: string;
  timezone: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type MembershipRow = {
  id: string;
  business_id: string;
  user_id: string;
  role: MembershipRole;
  status: string;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  suspended_at: string | null;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
};

const BUSINESS_SELECT =
  "id, slug, business_category_id, legal_name, display_name, description, commercial_registration_number, phone, email, website, status, verification_status, source_application_id, logo_path, cover_path, average_rating, rating_count, approved_at, approved_by, suspended_at, suspended_reason, closed_at, metadata, created_at, updated_at";

const SETTINGS_SELECT =
  "id, business_id, appointments_enabled, products_enabled, quotations_enabled, invoices_enabled, cash_payments_enabled, online_payments_enabled, reviews_enabled, auto_confirm_appointments, default_appointment_duration_minutes, minimum_booking_notice_minutes, maximum_booking_days_ahead, cancellation_notice_minutes, currency, locale, timezone, metadata, created_at, updated_at";

const MEMBERSHIP_SELECT =
  "id, business_id, user_id, role, status, invited_by, invited_at, accepted_at, suspended_at, removed_at, created_at, updated_at";

function toBusinessRecord(row: BusinessRow): BusinessRecord {
  return {
    id: row.id,
    slug: row.slug,
    businessCategoryId: row.business_category_id,
    legalName: row.legal_name,
    displayName: row.display_name,
    description: row.description,
    commercialRegistrationNumber: row.commercial_registration_number,
    phone: row.phone,
    email: row.email,
    website: row.website,
    status: row.status,
    verificationStatus: row.verification_status,
    sourceApplicationId: row.source_application_id,
    logoPath: row.logo_path,
    coverPath: row.cover_path,
    averageRating: Number(row.average_rating),
    ratingCount: row.rating_count,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    suspendedAt: row.suspended_at,
    suspendedReason: row.suspended_reason,
    closedAt: row.closed_at,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSettingsRecord(row: SettingsRow): BusinessSettingsRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    appointmentsEnabled: row.appointments_enabled,
    productsEnabled: row.products_enabled,
    quotationsEnabled: row.quotations_enabled,
    invoicesEnabled: row.invoices_enabled,
    cashPaymentsEnabled: row.cash_payments_enabled,
    onlinePaymentsEnabled: row.online_payments_enabled,
    reviewsEnabled: row.reviews_enabled,
    autoConfirmAppointments: row.auto_confirm_appointments,
    defaultAppointmentDurationMinutes: row.default_appointment_duration_minutes,
    minimumBookingNoticeMinutes: row.minimum_booking_notice_minutes,
    maximumBookingDaysAhead: row.maximum_booking_days_ahead,
    cancellationNoticeMinutes: row.cancellation_notice_minutes,
    currency: row.currency,
    locale: row.locale,
    timezone: row.timezone,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMembershipRecord(row: MembershipRow): BusinessMembershipRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    userId: row.user_id,
    role: row.role,
    status: row.status as BusinessMembershipRecord["status"],
    invitedBy: row.invited_by,
    invitedAt: row.invited_at,
    acceptedAt: row.accepted_at,
    suspendedAt: row.suspended_at,
    removedAt: row.removed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSupabaseError(error: { code?: string; message?: string }): never {
  if (error.code === "23505") {
    throw new ConflictError(
      ErrorCodes.Resource.Conflict,
      "A conflicting record already exists.",
      error,
    );
  }
  throw new InternalError("Database operation failed.", error);
}

export class SupabaseBusinessRepository implements BusinessRepository {
  constructor(
    private readonly userClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  private readClient(kind: "user" | "admin" = "user"): SupabaseClient {
    return kind === "admin" ? this.adminClient : this.userClient;
  }

  async findById(
    id: string,
    client: "user" | "admin" = "user",
  ): Promise<BusinessRecord | null> {
    const { data, error } = await this.readClient(client)
      .from("businesses")
      .select(BUSINESS_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load business.", error);
    if (!data) return null;
    return toBusinessRecord(data as BusinessRow);
  }

  async findPublicById(id: string): Promise<BusinessRecord | null> {
    const { data, error } = await this.userClient
      .from("businesses")
      .select(BUSINESS_SELECT)
      .eq("id", id)
      .eq("status", "active")
      .eq("verification_status", "verified")
      .maybeSingle();

    if (error) throw new InternalError("Failed to load public business.", error);
    if (!data) return null;
    return toBusinessRecord(data as BusinessRow);
  }

  async updateFields(
    id: string,
    input: UpdateBusinessPersistenceInput,
  ): Promise<BusinessRecord> {
    const patch: Record<string, unknown> = {};
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.description !== undefined) patch.description = input.description;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.email !== undefined) patch.email = input.email;
    if (input.website !== undefined) patch.website = input.website;
    if (input.logoPath !== undefined) patch.logo_path = input.logoPath;
    if (input.coverPath !== undefined) patch.cover_path = input.coverPath;

    const { data, error } = await this.adminClient
      .from("businesses")
      .update(patch)
      .eq("id", id)
      .select(BUSINESS_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Business was not found.");
    return toBusinessRecord(data as BusinessRow);
  }

  async findSettings(
    businessId: string,
    client: "user" | "admin" = "user",
  ): Promise<BusinessSettingsRecord | null> {
    const db = client === "admin" ? this.adminClient : this.userClient;
    const { data, error } = await db
      .from("business_settings")
      .select(SETTINGS_SELECT)
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load settings.", error);
    if (!data) return null;
    return toSettingsRecord(data as SettingsRow);
  }

  async updateSettings(
    businessId: string,
    input: UpdateBusinessSettingsPersistenceInput,
  ): Promise<BusinessSettingsRecord> {
    const patch: Record<string, unknown> = {};
    if (input.appointmentsEnabled !== undefined) {
      patch.appointments_enabled = input.appointmentsEnabled;
    }
    if (input.productsEnabled !== undefined) patch.products_enabled = input.productsEnabled;
    if (input.quotationsEnabled !== undefined) {
      patch.quotations_enabled = input.quotationsEnabled;
    }
    if (input.invoicesEnabled !== undefined) patch.invoices_enabled = input.invoicesEnabled;
    if (input.cashPaymentsEnabled !== undefined) {
      patch.cash_payments_enabled = input.cashPaymentsEnabled;
    }
    if (input.onlinePaymentsEnabled !== undefined) {
      patch.online_payments_enabled = input.onlinePaymentsEnabled;
    }
    if (input.reviewsEnabled !== undefined) patch.reviews_enabled = input.reviewsEnabled;
    if (input.autoConfirmAppointments !== undefined) {
      patch.auto_confirm_appointments = input.autoConfirmAppointments;
    }
    if (input.defaultAppointmentDurationMinutes !== undefined) {
      patch.default_appointment_duration_minutes =
        input.defaultAppointmentDurationMinutes;
    }
    if (input.minimumBookingNoticeMinutes !== undefined) {
      patch.minimum_booking_notice_minutes = input.minimumBookingNoticeMinutes;
    }
    if (input.maximumBookingDaysAhead !== undefined) {
      patch.maximum_booking_days_ahead = input.maximumBookingDaysAhead;
    }
    if (input.cancellationNoticeMinutes !== undefined) {
      patch.cancellation_notice_minutes = input.cancellationNoticeMinutes;
    }
    if (input.currency !== undefined) patch.currency = input.currency;
    if (input.locale !== undefined) patch.locale = input.locale;
    if (input.timezone !== undefined) patch.timezone = input.timezone;
    if (input.metadata !== undefined) patch.metadata = input.metadata;

    const { data, error } = await this.adminClient
      .from("business_settings")
      .update(patch)
      .eq("business_id", businessId)
      .select(SETTINGS_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Business settings were not found.");
    return toSettingsRecord(data as SettingsRow);
  }

  async findActiveMembership(
    businessId: string,
    userId: string,
  ): Promise<BusinessMembershipRecord | null> {
    const { data, error } = await this.adminClient
      .from("business_memberships")
      .select(MEMBERSHIP_SELECT)
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw new InternalError("Failed to load membership.", error);
    if (!data) return null;
    return toMembershipRecord(data as MembershipRow);
  }

  async listActiveMembershipsForUser(
    userId: string,
  ): Promise<Array<{ membership: BusinessMembershipRecord; business: BusinessRecord }>> {
    const { data, error } = await this.userClient
      .from("business_memberships")
      .select(`${MEMBERSHIP_SELECT}, businesses (${BUSINESS_SELECT})`)
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at");

    if (error) throw new InternalError("Failed to list memberships.", error);

    return ((data ?? []) as unknown as Array<
      MembershipRow & { businesses: BusinessRow | BusinessRow[] | null }
    >)
      .map((row) => {
        const businessRow = Array.isArray(row.businesses)
          ? row.businesses[0]
          : row.businesses;
        if (!businessRow) return null;
        return {
          membership: toMembershipRecord(row),
          business: toBusinessRecord(businessRow),
        };
      })
      .filter((item): item is {
        membership: BusinessMembershipRecord;
        business: BusinessRecord;
      } => item !== null);
  }

  async countActiveOwners(businessId: string): Promise<number> {
    const { data, error } = await this.adminClient.rpc("count_active_owners", {
      p_business_id: businessId,
    });

    if (error) throw new InternalError("Failed to count owners.", error);
    return Number(data ?? 0);
  }

  async insertNotification(input: NotificationInsertInput): Promise<void> {
    const { error } = await this.adminClient.from("notifications").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) throw new InternalError("Failed to insert notification.", error);
  }
}
