import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import type { BusinessApplicationRepository } from "./business-application.repository.interface.ts";
import type {
  ApplicationStatusAdminPatch,
  ApproveApplicationResult,
  BusinessApplicationBranchRecord,
  BusinessApplicationRecord,
  BusinessApplicationStepRecord,
  BusinessCategoryRecord,
  BusinessDocumentRequirementRecord,
  CreateApplicationPersistenceInput,
  ListApplicationsFilter,
  UpdateApplicationPersistenceInput,
  UpdateBranchPersistenceInput,
} from "./business-application.types.ts";

type ApplicationRow = {
  id: string;
  applicant_user_id: string;
  business_category_id: string;
  legal_name: string;
  display_name: string;
  description: string | null;
  commercial_registration_number: string | null;
  phone: string;
  email: string;
  website: string | null;
  status: string;
  current_step: string;
  submitted_at: string | null;
  review_started_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  withdrawn_at: string | null;
  changes_requested_at: string | null;
  rejection_reason: string | null;
  changes_requested_reason: string | null;
  assigned_reviewer_id: string | null;
  created_business_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type BranchRow = {
  id: string;
  application_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  address_line: string | null;
  area: string | null;
  city: string | null;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  created_at: string;
  updated_at: string;
};

type StepRow = {
  id: string;
  application_id: string;
  step_code: string;
  status: string;
  data: Record<string, unknown>;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type RequirementRow = {
  id: string;
  business_category_id: string;
  document_type: string;
  display_name: string;
  description: string | null;
  is_required: boolean;
  requires_expiry_date: boolean;
  allowed_mime_types: string[];
  maximum_file_size_bytes: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const APPLICATION_SELECT =
  "id, applicant_user_id, business_category_id, legal_name, display_name, description, commercial_registration_number, phone, email, website, status, current_step, submitted_at, review_started_at, approved_at, rejected_at, withdrawn_at, changes_requested_at, rejection_reason, changes_requested_reason, assigned_reviewer_id, created_business_id, metadata, created_at, updated_at";

function toApplicationRecord(row: ApplicationRow): BusinessApplicationRecord {
  return {
    id: row.id,
    applicantUserId: row.applicant_user_id,
    businessCategoryId: row.business_category_id,
    legalName: row.legal_name,
    displayName: row.display_name,
    description: row.description,
    commercialRegistrationNumber: row.commercial_registration_number,
    phone: row.phone,
    email: row.email,
    website: row.website,
    status: row.status,
    currentStep: row.current_step,
    submittedAt: row.submitted_at,
    reviewStartedAt: row.review_started_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    withdrawnAt: row.withdrawn_at,
    changesRequestedAt: row.changes_requested_at,
    rejectionReason: row.rejection_reason,
    changesRequestedReason: row.changes_requested_reason,
    assignedReviewerId: row.assigned_reviewer_id,
    createdBusinessId: row.created_business_id,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toBranchRecord(row: BranchRow): BusinessApplicationBranchRecord {
  return {
    id: row.id,
    applicationId: row.application_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    addressLine: row.address_line,
    area: row.area,
    city: row.city,
    countryCode: row.country_code,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toStepRecord(row: StepRow): BusinessApplicationStepRecord {
  return {
    id: row.id,
    applicationId: row.application_id,
    stepCode: row.step_code,
    status: row.status,
    data: row.data ?? {},
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCategoryRecord(row: CategoryRow): BusinessCategoryRecord {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRequirementRecord(
  row: RequirementRow,
): BusinessDocumentRequirementRecord {
  return {
    id: row.id,
    businessCategoryId: row.business_category_id,
    documentType: row.document_type,
    displayName: row.display_name,
    description: row.description,
    isRequired: row.is_required,
    requiresExpiryDate: row.requires_expiry_date,
    allowedMimeTypes: row.allowed_mime_types,
    maximumFileSizeBytes: row.maximum_file_size_bytes,
    sortOrder: row.sort_order,
    isActive: row.is_active,
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

export class SupabaseBusinessApplicationRepository
  implements BusinessApplicationRepository {
  constructor(
    private readonly userClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async create(
    input: CreateApplicationPersistenceInput,
  ): Promise<BusinessApplicationRecord> {
    const { data, error } = await this.userClient
      .from("business_applications")
      .insert({
        applicant_user_id: input.applicantUserId,
        business_category_id: input.businessCategoryId,
        legal_name: input.legalName,
        display_name: input.displayName,
        description: input.description ?? null,
        commercial_registration_number:
          input.commercialRegistrationNumber ?? null,
        phone: input.phone,
        email: input.email,
        website: input.website ?? null,
      })
      .select(APPLICATION_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create application.");
    return toApplicationRecord(data as ApplicationRow);
  }

  async findById(id: string): Promise<BusinessApplicationRecord | null> {
    const { data, error } = await this.userClient
      .from("business_applications")
      .select(APPLICATION_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load application.", error);
    if (!data) return null;
    return toApplicationRecord(data as ApplicationRow);
  }

  async findByApplicant(
    userId: string,
  ): Promise<BusinessApplicationRecord[]> {
    const { data, error } = await this.userClient
      .from("business_applications")
      .select(APPLICATION_SELECT)
      .eq("applicant_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new InternalError("Failed to list applications.", error);
    return ((data ?? []) as ApplicationRow[]).map(toApplicationRecord);
  }

  async findAll(
    filters: ListApplicationsFilter,
  ): Promise<{ items: BusinessApplicationRecord[]; total: number }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.userClient
      .from("business_applications")
      .select(APPLICATION_SELECT, { count: "exact" });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.assignedReviewerId) {
      query = query.eq("assigned_reviewer_id", filters.assignedReviewerId);
    }

    const { data, error, count } = await query
      .order("submitted_at", { ascending: true, nullsFirst: false })
      .range(from, to);

    if (error) throw new InternalError("Failed to list applications.", error);
    return {
      items: ((data ?? []) as ApplicationRow[]).map(toApplicationRecord),
      total: count ?? 0,
    };
  }

  async updateFields(
    id: string,
    input: UpdateApplicationPersistenceInput,
  ): Promise<BusinessApplicationRecord> {
    const patch: Record<string, unknown> = {};
    if (input.businessCategoryId !== undefined) {
      patch.business_category_id = input.businessCategoryId;
    }
    if (input.legalName !== undefined) patch.legal_name = input.legalName;
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.description !== undefined) patch.description = input.description;
    if (input.commercialRegistrationNumber !== undefined) {
      patch.commercial_registration_number = input.commercialRegistrationNumber;
    }
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.email !== undefined) patch.email = input.email;
    if (input.website !== undefined) patch.website = input.website;
    if (input.currentStep !== undefined) patch.current_step = input.currentStep;

    const { data, error } = await this.userClient
      .from("business_applications")
      .update(patch)
      .eq("id", id)
      .select(APPLICATION_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Business application was not found.");
    return toApplicationRecord(data as ApplicationRow);
  }

  async updateStatusAdmin(
    id: string,
    patch: ApplicationStatusAdminPatch,
  ): Promise<BusinessApplicationRecord> {
    const row: Record<string, unknown> = { status: patch.status };
    if (patch.submittedAt !== undefined) row.submitted_at = patch.submittedAt;
    if (patch.reviewStartedAt !== undefined) {
      row.review_started_at = patch.reviewStartedAt;
    }
    if (patch.approvedAt !== undefined) row.approved_at = patch.approvedAt;
    if (patch.rejectedAt !== undefined) row.rejected_at = patch.rejectedAt;
    if (patch.withdrawnAt !== undefined) row.withdrawn_at = patch.withdrawnAt;
    if (patch.changesRequestedAt !== undefined) {
      row.changes_requested_at = patch.changesRequestedAt;
    }
    if (patch.rejectionReason !== undefined) {
      row.rejection_reason = patch.rejectionReason;
    }
    if (patch.changesRequestedReason !== undefined) {
      row.changes_requested_reason = patch.changesRequestedReason;
    }
    if (patch.assignedReviewerId !== undefined) {
      row.assigned_reviewer_id = patch.assignedReviewerId;
    }
    if (patch.createdBusinessId !== undefined) {
      row.created_business_id = patch.createdBusinessId;
    }

    const { data, error } = await this.adminClient
      .from("business_applications")
      .update(row)
      .eq("id", id)
      .select(APPLICATION_SELECT)
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new NotFoundError("Business application was not found.");
    return toApplicationRecord(data as ApplicationRow);
  }

  async findBranch(
    applicationId: string,
  ): Promise<BusinessApplicationBranchRecord | null> {
    const { data, error } = await this.userClient
      .from("business_application_branches")
      .select(
        "id, application_id, name, phone, email, address_line, area, city, country_code, latitude, longitude, timezone, created_at, updated_at",
      )
      .eq("application_id", applicationId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load branch.", error);
    if (!data) return null;
    return toBranchRecord(data as BranchRow);
  }

  async upsertBranch(
    applicationId: string,
    input: UpdateBranchPersistenceInput,
  ): Promise<BusinessApplicationBranchRecord> {
    const existing = await this.findBranch(applicationId);
    const patch: Record<string, unknown> = { application_id: applicationId };
    if (input.name !== undefined) patch.name = input.name;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.email !== undefined) patch.email = input.email;
    if (input.addressLine !== undefined) patch.address_line = input.addressLine;
    if (input.area !== undefined) patch.area = input.area;
    if (input.city !== undefined) patch.city = input.city;
    if (input.countryCode !== undefined) patch.country_code = input.countryCode;
    if (input.latitude !== undefined) patch.latitude = input.latitude;
    if (input.longitude !== undefined) patch.longitude = input.longitude;
    if (input.timezone !== undefined) patch.timezone = input.timezone;

    if (existing) {
      const { data, error } = await this.userClient
        .from("business_application_branches")
        .update(patch)
        .eq("application_id", applicationId)
        .select(
          "id, application_id, name, phone, email, address_line, area, city, country_code, latitude, longitude, timezone, created_at, updated_at",
        )
        .single();

      if (error) mapSupabaseError(error);
      if (!data) throw new NotFoundError("Branch was not found.");
      return toBranchRecord(data as BranchRow);
    }

    const { data, error } = await this.userClient
      .from("business_application_branches")
      .insert(patch)
      .select(
        "id, application_id, name, phone, email, address_line, area, city, country_code, latitude, longitude, timezone, created_at, updated_at",
      )
      .single();

    if (error) mapSupabaseError(error);
    if (!data) throw new InternalError("Failed to create branch.");
    return toBranchRecord(data as BranchRow);
  }

  async findSteps(applicationId: string): Promise<BusinessApplicationStepRecord[]> {
    const { data, error } = await this.userClient
      .from("business_application_steps")
      .select(
        "id, application_id, step_code, status, data, completed_at, created_at, updated_at",
      )
      .eq("application_id", applicationId)
      .order("step_code");

    if (error) throw new InternalError("Failed to load steps.", error);
    return ((data ?? []) as StepRow[]).map(toStepRecord);
  }

  async approveViaRpc(
    applicationId: string,
    actorUserId: string,
    requestId?: string,
  ): Promise<ApproveApplicationResult> {
    const { data, error } = await this.adminClient.rpc(
      "approve_business_application",
      {
        p_application_id: applicationId,
        p_actor_user_id: actorUserId,
        p_request_id: requestId ?? null,
      },
    );

    if (error) {
      const message = error.message ?? "Approval failed.";
      if (message.includes("APPLICATION_NOT_FOUND")) {
        throw new NotFoundError("Business application was not found.");
      }
      if (message.includes("INVALID_STATUS")) {
        throw new ConflictError(
          ErrorCodes.Resource.InvalidStateTransition,
          "Application must be under review to approve.",
        );
      }
      throw new InternalError(message, error);
    }

    const result = data as {
      success: boolean;
      businessId: string;
      slug?: string;
      idempotent: boolean;
    };

    return {
      success: result.success,
      businessId: result.businessId,
      slug: result.slug,
      idempotent: result.idempotent,
    };
  }

  async listCategories(): Promise<BusinessCategoryRecord[]> {
    const { data, error } = await this.userClient
      .from("business_categories")
      .select(
        "id, code, name, description, sort_order, is_active, created_at, updated_at",
      )
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw new InternalError("Failed to list categories.", error);
    return ((data ?? []) as CategoryRow[]).map(toCategoryRecord);
  }

  async findCategoryById(id: string): Promise<BusinessCategoryRecord | null> {
    const { data, error } = await this.userClient
      .from("business_categories")
      .select(
        "id, code, name, description, sort_order, is_active, created_at, updated_at",
      )
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load category.", error);
    if (!data) return null;
    return toCategoryRecord(data as CategoryRow);
  }

  async listRequirements(
    categoryId: string,
  ): Promise<BusinessDocumentRequirementRecord[]> {
    const { data, error } = await this.userClient
      .from("business_document_requirements")
      .select(
        "id, business_category_id, document_type, display_name, description, is_required, requires_expiry_date, allowed_mime_types, maximum_file_size_bytes, sort_order, is_active, created_at, updated_at",
      )
      .eq("business_category_id", categoryId)
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw new InternalError("Failed to list requirements.", error);
    return ((data ?? []) as RequirementRow[]).map(toRequirementRecord);
  }

  async findRequirementById(
    id: string,
  ): Promise<BusinessDocumentRequirementRecord | null> {
    const { data, error } = await this.userClient
      .from("business_document_requirements")
      .select(
        "id, business_category_id, document_type, display_name, description, is_required, requires_expiry_date, allowed_mime_types, maximum_file_size_bytes, sort_order, is_active, created_at, updated_at",
      )
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load requirement.", error);
    if (!data) return null;
    return toRequirementRecord(data as RequirementRow);
  }
}
