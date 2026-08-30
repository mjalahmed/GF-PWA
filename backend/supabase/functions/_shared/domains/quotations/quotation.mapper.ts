import type {
  QuotationItemDto,
  QuotationResponseDto,
  QuotationStatusHistoryDto,
} from "./quotation.dto.ts";
import type {
  QuotationItemRecord,
  QuotationRecord,
  QuotationStatusHistoryRecord,
} from "./quotation.types.ts";

export class QuotationMapper {
  static toItemDto(record: QuotationItemRecord): QuotationItemDto {
    return {
      id: record.id,
      itemType: record.itemType,
      serviceId: record.serviceId,
      productId: record.productId,
      description: record.description,
      quantity: record.quantity,
      unitPrice: record.unitPrice,
      discountAmount: record.discountAmount,
      taxAmount: record.taxAmount,
      lineTotal: record.lineTotal,
      serviceName: record.serviceNameSnapshot,
      productName: record.productNameSnapshot,
      sku: record.skuSnapshot,
      sortOrder: record.sortOrder,
    };
  }

  static toHistoryDto(
    record: QuotationStatusHistoryRecord,
  ): QuotationStatusHistoryDto {
    return {
      id: record.id,
      fromStatus: record.fromStatus,
      toStatus: record.toStatus,
      changedBy: record.changedBy,
      note: record.note,
      createdAt: record.createdAt,
    };
  }

  static toDto(
    record: QuotationRecord,
    options?: { includeBusinessNotes?: boolean; includeHistory?: boolean },
  ): QuotationResponseDto {
    const dto: QuotationResponseDto = {
      id: record.id,
      quotationNumber: record.quotationNumber,
      customerId: record.customerId,
      businessId: record.businessId,
      branchId: record.branchId,
      vehicleId: record.vehicleId,
      appointmentId: record.appointmentId,
      rootQuotationId: record.rootQuotationId,
      previousRevisionId: record.previousRevisionId,
      revisionNumber: record.revisionNumber,
      status: record.status,
      subtotal: record.subtotal,
      discountTotal: record.discountTotal,
      taxTotal: record.taxTotal,
      grandTotal: record.grandTotal,
      currency: record.currency,
      validUntil: record.validUntil,
      customerMessage: record.customerMessage,
      issuedAt: record.issuedAt,
      viewedAt: record.viewedAt,
      acceptedAt: record.acceptedAt,
      rejectedAt: record.rejectedAt,
      cancelledAt: record.cancelledAt,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items: record.items.map(QuotationMapper.toItemDto),
      statusHistory: options?.includeHistory && record.statusHistory
        ? record.statusHistory.map(QuotationMapper.toHistoryDto)
        : undefined,
    };

    if (options?.includeBusinessNotes) {
      dto.businessNotes = record.businessNotes;
    }

    return dto;
  }
}
