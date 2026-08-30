import type {
  QuotationItemType,
  QuotationStatus,
} from "../../core/constants/statuses.ts";

export type QuotationItemDto = {
  id: string;
  itemType: QuotationItemType;
  serviceId: string | null;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  serviceName: string | null;
  productName: string | null;
  sku: string | null;
  sortOrder: number;
};

export type QuotationStatusHistoryDto = {
  id: string;
  fromStatus: QuotationStatus | null;
  toStatus: QuotationStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
};

export type QuotationResponseDto = {
  id: string;
  quotationNumber: string;
  customerId: string;
  businessId: string;
  branchId: string;
  vehicleId: string | null;
  appointmentId: string | null;
  rootQuotationId: string;
  previousRevisionId: string | null;
  revisionNumber: number;
  status: QuotationStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
  validUntil: string | null;
  customerMessage: string | null;
  businessNotes?: string | null;
  issuedAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: QuotationItemDto[];
  statusHistory?: QuotationStatusHistoryDto[];
};

export type QuotationItemInputDto = {
  itemType: QuotationItemType;
  serviceId?: string | null;
  productId?: string | null;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  sortOrder?: number;
};

export type CreateQuotationRequestDto = {
  customerId: string;
  branchId: string;
  vehicleId?: string | null;
  appointmentId?: string | null;
  validUntil?: string | null;
  customerMessage?: string | null;
  businessNotes?: string | null;
  items: QuotationItemInputDto[];
};

export type UpdateQuotationRequestDto = {
  branchId?: string;
  vehicleId?: string | null;
  appointmentId?: string | null;
  validUntil?: string | null;
  customerMessage?: string | null;
  businessNotes?: string | null;
  items: QuotationItemInputDto[];
};

export type TransitionRequestDto = {
  note?: string | null;
};
