import type {
  QuotationItemType,
  QuotationStatus,
} from "../../core/constants/statuses.ts";

export type QuotationItemRecord = {
  id: string;
  quotationId: string;
  itemType: QuotationItemType;
  serviceId: string | null;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  serviceNameSnapshot: string | null;
  productNameSnapshot: string | null;
  skuSnapshot: string | null;
  sortOrder: number;
  createdAt: string;
};

export type QuotationStatusHistoryRecord = {
  id: string;
  quotationId: string;
  fromStatus: QuotationStatus | null;
  toStatus: QuotationStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
};

export type QuotationRecord = {
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
  businessNotes: string | null;
  issuedAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: QuotationItemRecord[];
  statusHistory?: QuotationStatusHistoryRecord[];
};

export type QuotationItemPersistenceInput = {
  itemType: QuotationItemType;
  serviceId: string | null;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  serviceNameSnapshot: string | null;
  productNameSnapshot: string | null;
  skuSnapshot: string | null;
  sortOrder: number;
};

export type CreateQuotationPersistenceInput = {
  customerId: string;
  businessId: string;
  branchId: string;
  vehicleId: string | null;
  appointmentId: string | null;
  status: QuotationStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  validUntil: string | null;
  customerMessage: string | null;
  businessNotes: string | null;
  createdBy: string;
  rootQuotationId?: string | null;
  previousRevisionId?: string | null;
  revisionNumber?: number;
  items: QuotationItemPersistenceInput[];
};

export type UpdateDraftPersistenceInput = {
  quotationId: string;
  branchId?: string;
  vehicleId?: string | null;
  appointmentId?: string | null;
  validUntil?: string | null;
  customerMessage?: string | null;
  businessNotes?: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  items: QuotationItemPersistenceInput[];
};

export type TransitionPersistenceInput = {
  quotationId: string;
  fromStatus: QuotationStatus;
  toStatus: QuotationStatus;
  actorUserId: string;
  note?: string | null;
  patch?: {
    issuedAt?: string | null;
    viewedAt?: string | null;
    acceptedAt?: string | null;
    rejectedAt?: string | null;
    cancelledAt?: string | null;
  };
};

export type ListQuotationsFilters = {
  businessId?: string;
  customerId?: string;
  status?: QuotationStatus | QuotationStatus[];
  from?: string;
  to?: string;
};
