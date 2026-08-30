import type {
  DisputeActorType,
  DisputeReasonCode,
  DisputeResolutionActionType,
  DisputeResolutionCode,
  DisputeStatus,
} from "../../core/constants/statuses.ts";

export const DISPUTE_EVIDENCE_BUCKET = "dispute-evidence";

export const DISPUTE_TERMINAL_STATUSES: readonly DisputeStatus[] = [
  "closed",
  "withdrawn",
] as const;

export const DISPUTE_MESSAGE_BLOCKED_STATUSES: readonly DisputeStatus[] = [
  "closed",
  "resolved",
  "rejected",
  "withdrawn",
] as const;

export type DisputeMessageRecord = {
  id: string;
  disputeId: string;
  senderUserId: string;
  senderType: DisputeActorType;
  message: string;
  isInternal: boolean;
  createdAt: string;
  senderDisplayName?: string | null;
};

export type DisputeEvidenceRecord = {
  id: string;
  disputeId: string;
  uploadedBy: string;
  uploaderType: DisputeActorType;
  storagePath: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  description: string | null;
  createdAt: string;
  downloadUrl?: string | null;
};

export type DisputeStatusHistoryRecord = {
  id: string;
  disputeId: string;
  previousStatus: DisputeStatus | null;
  newStatus: DisputeStatus;
  changedBy: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type DisputeResolutionActionRecord = {
  id: string;
  disputeId: string;
  actionType: DisputeResolutionActionType;
  performedBy: string;
  resolutionCode: DisputeResolutionCode | null;
  description: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type DisputeRecord = {
  id: string;
  disputeNumber: string;
  openedBy: string;
  openedByType: DisputeActorType;
  customerId: string;
  businessId: string;
  appointmentId: string | null;
  quotationId: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  reviewId: string | null;
  reasonCode: DisputeReasonCode;
  summary: string;
  description: string | null;
  status: DisputeStatus;
  assignedAdminId: string | null;
  resolutionCode: DisputeResolutionCode | null;
  resolutionSummary: string | null;
  internalNotes: string | null;
  openedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: DisputeMessageRecord[];
  evidence?: DisputeEvidenceRecord[];
  statusHistory?: DisputeStatusHistoryRecord[];
  resolutionActions?: DisputeResolutionActionRecord[];
};

export type DisputeSourceRefs = {
  appointmentId?: string | null;
  quotationId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  reviewId?: string | null;
};

export type DisputeSourceContext = {
  appointment?: {
    id: string;
    status: string;
    scheduledStart: string;
    completedAt: string | null;
  } | null;
  quotation?: {
    id: string;
    quotationNumber: string;
    status: string;
    grandTotal: number;
    currency: string;
    acceptedAt: string | null;
  } | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
    grandTotal: number;
    paidTotal: number;
    currency: string;
    paidAt: string | null;
  } | null;
  payment?: {
    id: string;
    paymentReference: string;
    status: string;
    amount: number;
    currency: string;
    confirmedAt: string | null;
  } | null;
  review?: {
    id: string;
    status: string;
    overallRating: number;
    createdAt: string;
  } | null;
};

export type DisputeWindowEventTimestamps = {
  invoicePaidAt?: string | null;
  appointmentCompletedAt?: string | null;
  reviewCreatedAt?: string | null;
  quotationAcceptedAt?: string | null;
  paymentConfirmedAt?: string | null;
  fallbackCreatedAt?: string | null;
};

export type ListDisputesFilters = {
  customerId?: string;
  businessId?: string;
  status?: DisputeStatus | DisputeStatus[];
  assignedAdminId?: string;
  page?: number;
  pageSize?: number;
};

export type CreateDisputePersistenceInput = {
  openedBy: string;
  openedByType: DisputeActorType;
  customerId: string;
  businessId: string;
  appointmentId?: string | null;
  quotationId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  reviewId?: string | null;
  reasonCode: DisputeReasonCode;
  summary: string;
  description?: string | null;
  status: DisputeStatus;
  initialMessage?: string | null;
};

export type UpdateDisputeStatusPersistenceInput = {
  disputeId: string;
  previousStatus: DisputeStatus;
  newStatus: DisputeStatus;
  changedBy: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  assignedAdminId?: string | null;
  resolutionCode?: DisputeResolutionCode | null;
  resolutionSummary?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
};

export type AddDisputeMessagePersistenceInput = {
  disputeId: string;
  senderUserId: string;
  senderType: DisputeActorType;
  message: string;
  isInternal?: boolean;
};

export type CreateDisputeEvidencePersistenceInput = {
  disputeId: string;
  uploadedBy: string;
  uploaderType: DisputeActorType;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  description?: string | null;
};

export type RecordDisputeActionPersistenceInput = {
  disputeId: string;
  actionType: DisputeResolutionActionType;
  performedBy: string;
  resolutionCode?: DisputeResolutionCode | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
};
