import type {
  DisputeActorType,
  DisputeReasonCode,
  DisputeResolutionActionType,
  DisputeResolutionCode,
  DisputeStatus,
} from "../../core/constants/statuses.ts";
import type { DisputeSourceContext } from "./dispute.types.ts";

export type DisputeMessageDto = {
  id: string;
  senderUserId: string;
  senderType: DisputeActorType;
  senderDisplayName: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
};

export type DisputeEvidenceDto = {
  id: string;
  uploadedBy: string;
  uploaderType: DisputeActorType;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  description: string | null;
  createdAt: string;
  downloadUrl?: string | null;
};

export type DisputeStatusHistoryDto = {
  id: string;
  previousStatus: DisputeStatus | null;
  newStatus: DisputeStatus;
  changedBy: string | null;
  reason: string | null;
  createdAt: string;
};

export type DisputeResolutionActionDto = {
  id: string;
  actionType: DisputeResolutionActionType;
  performedBy: string;
  resolutionCode: DisputeResolutionCode | null;
  description: string | null;
  createdAt: string;
};

export type DisputeSourceContextDto = DisputeSourceContext;

export type CustomerDisputeDto = {
  id: string;
  disputeNumber: string;
  customerId: string;
  businessId: string;
  openedByType: DisputeActorType;
  reasonCode: DisputeReasonCode;
  summary: string;
  description: string | null;
  status: DisputeStatus;
  appointmentId: string | null;
  quotationId: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  reviewId: string | null;
  resolutionCode: DisputeResolutionCode | null;
  resolutionSummary: string | null;
  openedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: DisputeMessageDto[];
  evidence: DisputeEvidenceDto[];
  sourceContext?: DisputeSourceContextDto;
};

export type BusinessDisputeDto = CustomerDisputeDto;

export type AdminDisputeDto = BusinessDisputeDto & {
  assignedAdminId: string | null;
  internalNotes: string | null;
  statusHistory: DisputeStatusHistoryDto[];
  resolutionActions: DisputeResolutionActionDto[];
};

export type CreateDisputeEvidenceResponseDto = {
  evidence: DisputeEvidenceDto;
  uploadUrl: string;
};

export type CreateCustomerDisputeRequestDto = {
  businessId: string;
  appointmentId?: string | null;
  quotationId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  reviewId?: string | null;
  reasonCode: DisputeReasonCode;
  summary: string;
  description?: string | null;
  initialMessage?: string | null;
};

export type CreateBusinessDisputeRequestDto = CreateCustomerDisputeRequestDto & {
  customerId: string;
};

export type DisputeMessageRequestDto = {
  message: string;
};

export type DisputeEvidenceRequestDto = {
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  description?: string | null;
};

export type DisputeAssignRequestDto = {
  assignedAdminId: string;
};

export type DisputeResolveRequestDto = {
  resolutionCode: DisputeResolutionCode;
  resolutionSummary: string;
  reason?: string | null;
};

export type DisputeRejectRequestDto = {
  reason: string;
};

export type DisputeCloseRequestDto = {
  reason?: string | null;
};

export type DisputeInternalMessageRequestDto = {
  message: string;
};

export type DisputeTransitionRequestDto = {
  reason?: string | null;
};
