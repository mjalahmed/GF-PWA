import type {
  InvoiceItemDto,
  InvoiceResponseDto,
  PaymentResponseDto,
} from "./invoice.dto.ts";
import type {
  InvoiceItemRecord,
  InvoiceRecord,
  PaymentRecord,
} from "./invoice.types.ts";

export class InvoiceMapper {
  static toItemDto(record: InvoiceItemRecord): InvoiceItemDto {
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

  static toDto(
    record: InvoiceRecord,
    options?: {
      includeBusinessNotes?: boolean;
      settlement?: {
        cashPaymentsEnabled: boolean;
        benefitPayEnabled: boolean;
        benefitPayPhone: string | null;
        benefitPayIban: string | null;
        benefitPayInstructions: string | null;
      };
    },
  ): InvoiceResponseDto {
    const dto: InvoiceResponseDto = {
      id: record.id,
      invoiceNumber: record.invoiceNumber,
      customerId: record.customerId,
      businessId: record.businessId,
      branchId: record.branchId,
      vehicleId: record.vehicleId,
      appointmentId: record.appointmentId,
      quotationId: record.quotationId,
      status: record.status,
      subtotal: record.subtotal,
      discountTotal: record.discountTotal,
      taxTotal: record.taxTotal,
      platformFeeTotal: record.platformFeeTotal,
      grandTotal: record.grandTotal,
      paidTotal: record.paidTotal,
      remainingTotal: record.remainingTotal,
      currency: record.currency,
      requiresCustomerApproval: record.requiresCustomerApproval,
      dueAt: record.dueAt,
      issuedAt: record.issuedAt,
      viewedAt: record.viewedAt,
      customerApprovedAt: record.customerApprovedAt,
      paidAt: record.paidAt,
      cancelledAt: record.cancelledAt,
      customerMessage: record.customerMessage,
      createdBy: record.createdBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      items: record.items.map(InvoiceMapper.toItemDto),
    };

    if (options?.includeBusinessNotes) {
      dto.businessNotes = record.businessNotes;
    }
    if (options?.settlement) {
      dto.cashPaymentsEnabled = options.settlement.cashPaymentsEnabled;
      dto.benefitPayEnabled = options.settlement.benefitPayEnabled;
      dto.benefitPayPhone = options.settlement.benefitPayPhone;
      dto.benefitPayIban = options.settlement.benefitPayIban;
      dto.benefitPayInstructions = options.settlement.benefitPayInstructions;
    }

    return dto;
  }

  static toPaymentDto(
    record: PaymentRecord,
    options?: { includeConfirmedBy?: boolean },
  ): PaymentResponseDto {
    const dto: PaymentResponseDto = {
      id: record.id,
      paymentReference: record.paymentReference,
      invoiceId: record.invoiceId,
      amount: record.amount,
      currency: record.currency,
      method: record.method,
      status: record.status,
      confirmedAt: record.confirmedAt,
      createdAt: record.createdAt,
    };

    if (options?.includeConfirmedBy) {
      dto.confirmedBy = record.confirmedBy;
    }

    return dto;
  }
}
