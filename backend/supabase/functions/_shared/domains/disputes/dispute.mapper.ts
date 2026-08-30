import type {
  AdminDisputeDto,
  BusinessDisputeDto,
  CustomerDisputeDto,
  DisputeEvidenceDto,
  DisputeMessageDto,
  DisputeResolutionActionDto,
  DisputeStatusHistoryDto,
} from "./dispute.dto.ts";
import type {
  DisputeEvidenceRecord,
  DisputeMessageRecord,
  DisputeRecord,
  DisputeResolutionActionRecord,
  DisputeSourceContext,
  DisputeStatusHistoryRecord,
} from "./dispute.types.ts";

export type DisputeAudience = "customer" | "business" | "admin";

export function formatDisputePartyDisplayName(
  fullName: string | null | undefined,
): string {
  if (!fullName?.trim()) return "Participant";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const lastInitial = parts[parts.length - 1]![0]?.toUpperCase();
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

export class DisputeMapper {
  static toMessageDto(
    record: DisputeMessageRecord,
    includeInternal: boolean,
  ): DisputeMessageDto | null {
    if (record.isInternal && !includeInternal) return null;
    return {
      id: record.id,
      senderUserId: record.senderUserId,
      senderType: record.senderType,
      senderDisplayName: formatDisputePartyDisplayName(record.senderDisplayName),
      message: record.message,
      isInternal: record.isInternal,
      createdAt: record.createdAt,
    };
  }

  static toEvidenceDto(record: DisputeEvidenceRecord): DisputeEvidenceDto {
    return {
      id: record.id,
      uploadedBy: record.uploadedBy,
      uploaderType: record.uploaderType,
      originalFileName: record.originalFileName,
      mimeType: record.mimeType,
      fileSizeBytes: record.fileSizeBytes,
      description: record.description,
      createdAt: record.createdAt,
      downloadUrl: record.downloadUrl ?? null,
    };
  }

  static toStatusHistoryDto(
    record: DisputeStatusHistoryRecord,
  ): DisputeStatusHistoryDto {
    return {
      id: record.id,
      previousStatus: record.previousStatus,
      newStatus: record.newStatus,
      changedBy: record.changedBy,
      reason: record.reason,
      createdAt: record.createdAt,
    };
  }

  static toResolutionActionDto(
    record: DisputeResolutionActionRecord,
    includeInternal: boolean,
  ): DisputeResolutionActionDto | null {
    if (record.actionType === "internal_note" && !includeInternal) return null;
    return {
      id: record.id,
      actionType: record.actionType,
      performedBy: record.performedBy,
      resolutionCode: record.resolutionCode,
      description: record.description,
      createdAt: record.createdAt,
    };
  }

  static toCustomerDto(
    record: DisputeRecord,
    sourceContext?: DisputeSourceContext,
    includeInternal = false,
  ): CustomerDisputeDto {
    const messages = (record.messages ?? [])
      .map((m) => DisputeMapper.toMessageDto(m, includeInternal))
      .filter((m): m is DisputeMessageDto => m !== null);

    return {
      id: record.id,
      disputeNumber: record.disputeNumber,
      customerId: record.customerId,
      businessId: record.businessId,
      openedByType: record.openedByType,
      reasonCode: record.reasonCode,
      summary: record.summary,
      description: record.description,
      status: record.status,
      appointmentId: record.appointmentId,
      quotationId: record.quotationId,
      invoiceId: record.invoiceId,
      paymentId: record.paymentId,
      reviewId: record.reviewId,
      resolutionCode: record.resolutionCode,
      resolutionSummary: record.resolutionSummary,
      openedAt: record.openedAt,
      resolvedAt: record.resolvedAt,
      closedAt: record.closedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      messages,
      evidence: (record.evidence ?? []).map(DisputeMapper.toEvidenceDto),
      sourceContext,
    };
  }

  static toBusinessDto(
    record: DisputeRecord,
    sourceContext?: DisputeSourceContext,
  ): BusinessDisputeDto {
    return DisputeMapper.toCustomerDto(record, sourceContext, false);
  }

  static toAdminDto(
    record: DisputeRecord,
    sourceContext?: DisputeSourceContext,
  ): AdminDisputeDto {
    const base = DisputeMapper.toCustomerDto(record, sourceContext, true);
    const statusHistory = (record.statusHistory ?? []).map(
      DisputeMapper.toStatusHistoryDto,
    );
    const resolutionActions = (record.resolutionActions ?? [])
      .map((a) => DisputeMapper.toResolutionActionDto(a, true))
      .filter((a): a is DisputeResolutionActionDto => a !== null);

    return {
      ...base,
      assignedAdminId: record.assignedAdminId,
      internalNotes: record.internalNotes,
      statusHistory,
      resolutionActions,
    };
  }

  static toAudienceDto(
    record: DisputeRecord,
    audience: DisputeAudience,
    sourceContext?: DisputeSourceContext,
  ): CustomerDisputeDto | BusinessDisputeDto | AdminDisputeDto {
    switch (audience) {
      case "customer":
        return DisputeMapper.toCustomerDto(record, sourceContext, false);
      case "business":
        return DisputeMapper.toBusinessDto(record, sourceContext);
      case "admin":
        return DisputeMapper.toAdminDto(record, sourceContext);
    }
  }
}

export function buildEvidenceStoragePath(
  disputeId: string,
  userId: string,
  evidenceId: string,
  originalFileName: string,
): string {
  const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `disputes/${disputeId}/${userId}/${evidenceId}/${safeName}`;
}
