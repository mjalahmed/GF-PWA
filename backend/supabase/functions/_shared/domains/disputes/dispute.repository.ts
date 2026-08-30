import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import {
  DisputeResolutionActionTypes,
  DisputeStatuses,
  type DisputeActorType,
  type DisputeReasonCode,
  type DisputeResolutionActionType,
  type DisputeResolutionCode,
  type DisputeStatus,
} from "../../core/constants/statuses.ts";
import { DisputeAlreadyExistsError } from "./dispute.errors.ts";
import { buildEvidenceStoragePath } from "./dispute.mapper.ts";
import type { DisputeRepository, ListDisputesResult } from "./dispute.repository.interface.ts";
import type {
  AddDisputeMessagePersistenceInput,
  CreateDisputeEvidencePersistenceInput,
  CreateDisputePersistenceInput,
  DisputeEvidenceRecord,
  DisputeMessageRecord,
  DisputeRecord,
  DisputeResolutionActionRecord,
  DisputeSourceContext,
  DisputeSourceRefs,
  DisputeStatusHistoryRecord,
  DisputeWindowEventTimestamps,
  ListDisputesFilters,
  RecordDisputeActionPersistenceInput,
  UpdateDisputeStatusPersistenceInput,
} from "./dispute.types.ts";
import { DISPUTE_EVIDENCE_BUCKET as EVIDENCE_BUCKET } from "./dispute.types.ts";

type DisputeRow = {
  id: string;
  dispute_number: string;
  opened_by: string;
  opened_by_type: DisputeActorType;
  customer_id: string;
  business_id: string;
  appointment_id: string | null;
  quotation_id: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  review_id: string | null;
  reason_code: DisputeReasonCode;
  summary: string;
  description: string | null;
  status: DisputeStatus;
  assigned_admin_id: string | null;
  resolution_code: DisputeResolutionCode | null;
  resolution_summary: string | null;
  internal_notes: string | null;
  opened_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  dispute_id: string;
  sender_user_id: string;
  sender_type: DisputeActorType;
  message: string;
  is_internal: boolean;
  created_at: string;
};

type EvidenceRow = {
  id: string;
  dispute_id: string;
  uploaded_by: string;
  uploader_type: DisputeActorType;
  storage_path: string;
  original_file_name: string;
  mime_type: string;
  file_size_bytes: number;
  description: string | null;
  created_at: string;
};

const DISPUTE_SELECT =
  "id, dispute_number, opened_by, opened_by_type, customer_id, business_id, appointment_id, quotation_id, invoice_id, payment_id, review_id, reason_code, summary, description, status, assigned_admin_id, resolution_code, resolution_summary, internal_notes, opened_at, resolved_at, closed_at, created_at, updated_at";

const ACTIVE_STATUSES = [
  DisputeStatuses.Opened,
  DisputeStatuses.AwaitingBusiness,
  DisputeStatuses.AwaitingCustomer,
  DisputeStatuses.UnderReview,
  DisputeStatuses.Resolved,
  DisputeStatuses.Rejected,
];

function toDispute(row: DisputeRow): DisputeRecord {
  return {
    id: row.id,
    disputeNumber: row.dispute_number,
    openedBy: row.opened_by,
    openedByType: row.opened_by_type,
    customerId: row.customer_id,
    businessId: row.business_id,
    appointmentId: row.appointment_id,
    quotationId: row.quotation_id,
    invoiceId: row.invoice_id,
    paymentId: row.payment_id,
    reviewId: row.review_id,
    reasonCode: row.reason_code,
    summary: row.summary,
    description: row.description,
    status: row.status,
    assignedAdminId: row.assigned_admin_id,
    resolutionCode: row.resolution_code,
    resolutionSummary: row.resolution_summary,
    internalNotes: row.internal_notes,
    openedAt: row.opened_at,
    resolvedAt: row.resolved_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMessage(row: MessageRow): DisputeMessageRecord {
  return {
    id: row.id,
    disputeId: row.dispute_id,
    senderUserId: row.sender_user_id,
    senderType: row.sender_type,
    message: row.message,
    isInternal: row.is_internal,
    createdAt: row.created_at,
  };
}

function toEvidence(row: EvidenceRow): DisputeEvidenceRecord {
  return {
    id: row.id,
    disputeId: row.dispute_id,
    uploadedBy: row.uploaded_by,
    uploaderType: row.uploader_type,
    storagePath: row.storage_path,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    description: row.description,
    createdAt: row.created_at,
  };
}

export class SupabaseDisputeRepository implements DisputeRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  private async loadProfileNames(userIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (userIds.length === 0) return map;

    const { data, error } = await this.adminClient
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    if (error) throw new InternalError("Failed to load profile names.", error);

    for (const row of (data ?? []) as Array<{ id: string; full_name: string | null }>) {
      map.set(row.id, row.full_name ?? "");
    }
    return map;
  }

  private async signedDownloadUrl(path: string): Promise<string | null> {
    const { data, error } = await this.adminClient.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }

  private async hydrateRecord(
    row: DisputeRow,
    options?: {
      includeMessages?: boolean;
      includeEvidence?: boolean;
      includeHistory?: boolean;
      includeActions?: boolean;
      signedEvidenceUrls?: boolean;
    },
  ): Promise<DisputeRecord> {
    const record = toDispute(row);

    if (options?.includeMessages) {
      const { data, error } = await this.adminClient
        .from("dispute_messages")
        .select("*")
        .eq("dispute_id", record.id)
        .order("created_at", { ascending: true });
      if (error) throw new InternalError("Failed to load dispute messages.", error);
      const messages = ((data ?? []) as MessageRow[]).map(toMessage);
      const names = await this.loadProfileNames(
        [...new Set(messages.map((m) => m.senderUserId))],
      );
      record.messages = messages.map((m) => ({
        ...m,
        senderDisplayName: names.get(m.senderUserId) ?? null,
      }));
    }

    if (options?.includeEvidence) {
      const { data, error } = await this.adminClient
        .from("dispute_evidence")
        .select("*")
        .eq("dispute_id", record.id)
        .order("created_at", { ascending: true });
      if (error) throw new InternalError("Failed to load dispute evidence.", error);
      const evidence = ((data ?? []) as EvidenceRow[]).map(toEvidence);
      if (options.signedEvidenceUrls) {
        record.evidence = await Promise.all(
          evidence.map(async (item) => ({
            ...item,
            downloadUrl: await this.signedDownloadUrl(item.storagePath),
          })),
        );
      } else {
        record.evidence = evidence;
      }
    }

    if (options?.includeHistory) {
      const { data, error } = await this.adminClient
        .from("dispute_status_history")
        .select("*")
        .eq("dispute_id", record.id)
        .order("created_at", { ascending: true });
      if (error) throw new InternalError("Failed to load dispute history.", error);
      record.statusHistory = ((data ?? []) as Array<{
        id: string;
        dispute_id: string;
        previous_status: DisputeStatus | null;
        new_status: DisputeStatus;
        changed_by: string | null;
        reason: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
      }>).map((h) => ({
        id: h.id,
        disputeId: h.dispute_id,
        previousStatus: h.previous_status,
        newStatus: h.new_status,
        changedBy: h.changed_by,
        reason: h.reason,
        metadata: h.metadata ?? {},
        createdAt: h.created_at,
      })) satisfies DisputeStatusHistoryRecord[];
    }

    if (options?.includeActions) {
      const { data, error } = await this.adminClient
        .from("dispute_resolution_actions")
        .select("*")
        .eq("dispute_id", record.id)
        .order("created_at", { ascending: true });
      if (error) throw new InternalError("Failed to load dispute actions.", error);
      record.resolutionActions = ((data ?? []) as Array<{
        id: string;
        dispute_id: string;
        action_type: DisputeResolutionActionType;
        performed_by: string;
        resolution_code: DisputeResolutionCode | null;
        description: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
      }>).map((a) => ({
        id: a.id,
        disputeId: a.dispute_id,
        actionType: a.action_type,
        performedBy: a.performed_by,
        resolutionCode: a.resolution_code,
        description: a.description,
        metadata: a.metadata ?? {},
        createdAt: a.created_at,
      })) satisfies DisputeResolutionActionRecord[];
    }

    return record;
  }

  async findById(
    disputeId: string,
    options?: {
      includeMessages?: boolean;
      includeEvidence?: boolean;
      includeHistory?: boolean;
      includeActions?: boolean;
      signedEvidenceUrls?: boolean;
    },
  ): Promise<DisputeRecord | null> {
    const { data, error } = await this.adminClient
      .from("disputes")
      .select(DISPUTE_SELECT)
      .eq("id", disputeId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load dispute.", error);
    if (!data) return null;
    return this.hydrateRecord(data as DisputeRow, options);
  }

  async list(filters: ListDisputesFilters): Promise<ListDisputesResult> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.adminClient
      .from("disputes")
      .select(DISPUTE_SELECT, { count: "exact" });

    if (filters.customerId) query = query.eq("customer_id", filters.customerId);
    if (filters.businessId) query = query.eq("business_id", filters.businessId);
    if (filters.assignedAdminId) {
      query = query.eq("assigned_admin_id", filters.assignedAdminId);
    }
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw new InternalError("Failed to list disputes.", error);

    return {
      items: ((data ?? []) as DisputeRow[]).map(toDispute),
      total: count ?? 0,
    };
  }

  async findActiveBySource(sources: DisputeSourceRefs): Promise<DisputeRecord | null> {
    let query = this.adminClient
      .from("disputes")
      .select(DISPUTE_SELECT)
      .in("status", ACTIVE_STATUSES);

    if (sources.invoiceId) query = query.eq("invoice_id", sources.invoiceId);
    else if (sources.appointmentId) {
      query = query.eq("appointment_id", sources.appointmentId).is("invoice_id", null);
    } else if (sources.paymentId) {
      query = query.eq("payment_id", sources.paymentId).is("invoice_id", null);
    } else if (sources.reviewId) query = query.eq("review_id", sources.reviewId);
    else if (sources.quotationId) {
      query = query.eq("quotation_id", sources.quotationId)
        .is("invoice_id", null)
        .is("appointment_id", null);
    } else {
      return null;
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw new InternalError("Failed to find active dispute.", error);
    if (!data) return null;
    return toDispute(data as DisputeRow);
  }

  async create(input: CreateDisputePersistenceInput): Promise<DisputeRecord> {
    const { data: disputeNumber, error: numberError } = await this.adminClient
      .rpc("next_dispute_number");
    if (numberError || !disputeNumber) {
      throw new InternalError("Failed to allocate dispute number.", numberError);
    }

    const { data, error } = await this.adminClient
      .from("disputes")
      .insert({
        dispute_number: disputeNumber,
        opened_by: input.openedBy,
        opened_by_type: input.openedByType,
        customer_id: input.customerId,
        business_id: input.businessId,
        appointment_id: input.appointmentId ?? null,
        quotation_id: input.quotationId ?? null,
        invoice_id: input.invoiceId ?? null,
        payment_id: input.paymentId ?? null,
        review_id: input.reviewId ?? null,
        reason_code: input.reasonCode,
        summary: input.summary,
        description: input.description ?? null,
        status: input.status,
        opened_at: new Date().toISOString(),
      })
      .select(DISPUTE_SELECT)
      .single();

    if (error) {
      if (error.code === "23505") {
        const existing = await this.findActiveBySource({
          appointmentId: input.appointmentId,
          quotationId: input.quotationId,
          invoiceId: input.invoiceId,
          paymentId: input.paymentId,
          reviewId: input.reviewId,
        });
        if (existing) throw new DisputeAlreadyExistsError(existing.id);
        throw new DisputeAlreadyExistsError();
      }
      throw new InternalError("Failed to create dispute.", error);
    }

    const record = toDispute(data as DisputeRow);

    await this.adminClient.from("dispute_status_history").insert({
      dispute_id: record.id,
      previous_status: null,
      new_status: input.status,
      changed_by: input.openedBy,
      reason: "Dispute opened",
    });

    if (input.initialMessage) {
      await this.adminClient.from("dispute_messages").insert({
        dispute_id: record.id,
        sender_user_id: input.openedBy,
        sender_type: input.openedByType,
        message: input.initialMessage,
        is_internal: false,
      });
    }

    return record;
  }

  async updateStatus(
    input: UpdateDisputeStatusPersistenceInput,
  ): Promise<DisputeRecord> {
    const patch: Record<string, unknown> = {
      status: input.newStatus,
    };
    if (input.assignedAdminId !== undefined) {
      patch.assigned_admin_id = input.assignedAdminId;
    }
    if (input.resolutionCode !== undefined) {
      patch.resolution_code = input.resolutionCode;
    }
    if (input.resolutionSummary !== undefined) {
      patch.resolution_summary = input.resolutionSummary;
    }
    if (input.resolvedAt !== undefined) patch.resolved_at = input.resolvedAt;
    if (input.closedAt !== undefined) patch.closed_at = input.closedAt;

    const { data, error } = await this.adminClient
      .from("disputes")
      .update(patch)
      .eq("id", input.disputeId)
      .select(DISPUTE_SELECT)
      .single();

    if (error) throw new InternalError("Failed to update dispute status.", error);

    await this.adminClient.from("dispute_status_history").insert({
      dispute_id: input.disputeId,
      previous_status: input.previousStatus,
      new_status: input.newStatus,
      changed_by: input.changedBy,
      reason: input.reason ?? null,
      metadata: input.metadata ?? {},
    });

    return toDispute(data as DisputeRow);
  }

  async assignAdmin(
    disputeId: string,
    assignedAdminId: string,
    performedBy: string,
  ): Promise<DisputeRecord> {
    const { data, error } = await this.adminClient
      .from("disputes")
      .update({ assigned_admin_id: assignedAdminId })
      .eq("id", disputeId)
      .select(DISPUTE_SELECT)
      .single();

    if (error) throw new InternalError("Failed to assign dispute.", error);

    await this.recordAction({
      disputeId,
      actionType: DisputeResolutionActionTypes.Assigned,
      performedBy,
      metadata: { assignedAdminId },
    });

    return toDispute(data as DisputeRow);
  }

  async addMessage(input: AddDisputeMessagePersistenceInput): Promise<DisputeRecord> {
    const { error } = await this.adminClient.from("dispute_messages").insert({
      dispute_id: input.disputeId,
      sender_user_id: input.senderUserId,
      sender_type: input.senderType,
      message: input.message,
      is_internal: input.isInternal ?? false,
    });
    if (error) throw new InternalError("Failed to add dispute message.", error);

    const record = await this.findById(input.disputeId, {
      includeMessages: true,
      includeEvidence: true,
      signedEvidenceUrls: true,
    });
    if (!record) throw new InternalError("Dispute missing after message insert.");
    return record;
  }

  async createEvidenceMetadata(
    input: CreateDisputeEvidencePersistenceInput,
  ): Promise<{ evidenceId: string; storagePath: string; uploadUrl: string }> {
    const evidenceId = crypto.randomUUID();
    const storagePath = buildEvidenceStoragePath(
      input.disputeId,
      input.uploadedBy,
      evidenceId,
      input.originalFileName,
    );

    const { error } = await this.adminClient.from("dispute_evidence").insert({
      id: evidenceId,
      dispute_id: input.disputeId,
      uploaded_by: input.uploadedBy,
      uploader_type: input.uploaderType,
      storage_path: storagePath,
      original_file_name: input.originalFileName,
      mime_type: input.mimeType,
      file_size_bytes: input.fileSizeBytes,
      description: input.description ?? null,
    });
    if (error) throw new InternalError("Failed to create dispute evidence.", error);

    const { data, error: uploadError } = await this.adminClient.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (uploadError || !data?.signedUrl) {
      throw new InternalError("Failed to create evidence upload URL.", uploadError);
    }

    return {
      evidenceId,
      storagePath,
      uploadUrl: data.signedUrl,
    };
  }

  async appendInternalNotes(disputeId: string, note: string): Promise<void> {
    const { data, error } = await this.adminClient
      .from("disputes")
      .select("internal_notes")
      .eq("id", disputeId)
      .single();
    if (error) throw new InternalError("Failed to load dispute notes.", error);

    const existing = (data as { internal_notes: string | null }).internal_notes;
    const combined = existing ? `${existing}\n${note}` : note;

    const { error: updateError } = await this.adminClient
      .from("disputes")
      .update({ internal_notes: combined })
      .eq("id", disputeId);
    if (updateError) throw new InternalError("Failed to update internal notes.", updateError);
  }

  async recordAction(input: RecordDisputeActionPersistenceInput): Promise<void> {
    const { error } = await this.adminClient.from("dispute_resolution_actions").insert({
      dispute_id: input.disputeId,
      action_type: input.actionType,
      performed_by: input.performedBy,
      resolution_code: input.resolutionCode ?? null,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
    });
    if (error) throw new InternalError("Failed to record dispute action.", error);
  }

  async loadSourceContext(record: DisputeRecord): Promise<DisputeSourceContext> {
    const context: DisputeSourceContext = {};

    if (record.appointmentId) {
      const { data } = await this.adminClient
        .from("appointments")
        .select("id, status, scheduled_start, completed_at")
        .eq("id", record.appointmentId)
        .maybeSingle();
      if (data) {
        context.appointment = {
          id: data.id,
          status: data.status,
          scheduledStart: data.scheduled_start,
          completedAt: data.completed_at,
        };
      }
    }

    if (record.quotationId) {
      const { data } = await this.adminClient
        .from("quotations")
        .select("id, quotation_number, status, grand_total, currency, accepted_at")
        .eq("id", record.quotationId)
        .maybeSingle();
      if (data) {
        context.quotation = {
          id: data.id,
          quotationNumber: data.quotation_number,
          status: data.status,
          grandTotal: Number(data.grand_total),
          currency: data.currency,
          acceptedAt: data.accepted_at,
        };
      }
    }

    if (record.invoiceId) {
      const { data } = await this.adminClient
        .from("invoices")
        .select(
          "id, invoice_number, status, grand_total, paid_total, currency, paid_at",
        )
        .eq("id", record.invoiceId)
        .maybeSingle();
      if (data) {
        context.invoice = {
          id: data.id,
          invoiceNumber: data.invoice_number,
          status: data.status,
          grandTotal: Number(data.grand_total),
          paidTotal: Number(data.paid_total),
          currency: data.currency,
          paidAt: data.paid_at,
        };
      }
    }

    if (record.paymentId) {
      const { data } = await this.adminClient
        .from("payments")
        .select(
          "id, payment_reference, status, amount, currency, confirmed_at",
        )
        .eq("id", record.paymentId)
        .maybeSingle();
      if (data) {
        context.payment = {
          id: data.id,
          paymentReference: data.payment_reference,
          status: data.status,
          amount: Number(data.amount),
          currency: data.currency,
          confirmedAt: data.confirmed_at,
        };
      }
    }

    if (record.reviewId) {
      const { data } = await this.adminClient
        .from("reviews")
        .select("id, status, overall_rating, created_at")
        .eq("id", record.reviewId)
        .maybeSingle();
      if (data) {
        context.review = {
          id: data.id,
          status: data.status,
          overallRating: data.overall_rating,
          createdAt: data.created_at,
        };
      }
    }

    return context;
  }

  async loadWindowEvents(record: DisputeRecord): Promise<DisputeWindowEventTimestamps> {
    const context = await this.loadSourceContext(record);
    return {
      invoicePaidAt: context.invoice?.paidAt ?? null,
      appointmentCompletedAt: context.appointment?.completedAt ?? null,
      reviewCreatedAt: context.review?.createdAt ?? null,
      quotationAcceptedAt: context.quotation?.acceptedAt ?? null,
      paymentConfirmedAt: context.payment?.confirmedAt ?? null,
      fallbackCreatedAt: record.createdAt,
    };
  }
}

export { EVIDENCE_BUCKET as DISPUTE_EVIDENCE_BUCKET };
