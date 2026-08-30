import type {
  InvoiceItemType,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from "../../core/constants/statuses.ts";

export type InvoiceItemRecord = {
  id: string;
  invoiceId: string;
  itemType: InvoiceItemType;
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

export type InvoiceStatusHistoryRecord = {
  id: string;
  invoiceId: string;
  previousStatus: InvoiceStatus | null;
  newStatus: InvoiceStatus;
  changedBy: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  businessId: string;
  branchId: string;
  vehicleId: string | null;
  appointmentId: string | null;
  quotationId: string | null;
  status: InvoiceStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  platformFeeTotal: number;
  grandTotal: number;
  paidTotal: number;
  remainingTotal: number;
  currency: string;
  requiresCustomerApproval: boolean;
  dueAt: string | null;
  issuedAt: string | null;
  viewedAt: string | null;
  customerApprovedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  customerMessage: string | null;
  businessNotes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItemRecord[];
  statusHistory?: InvoiceStatusHistoryRecord[];
};

export type InvoiceItemPersistenceInput = {
  itemType: InvoiceItemType;
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

export type CreateInvoicePersistenceInput = {
  customerId: string;
  businessId: string;
  branchId: string;
  vehicleId: string | null;
  appointmentId: string | null;
  quotationId?: string | null;
  status: InvoiceStatus;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  platformFeeTotal: number;
  grandTotal: number;
  paidTotal: number;
  remainingTotal: number;
  requiresCustomerApproval: boolean;
  dueAt: string | null;
  customerMessage: string | null;
  businessNotes: string | null;
  createdBy: string;
  items: InvoiceItemPersistenceInput[];
};

export type UpdateDraftPersistenceInput = {
  invoiceId: string;
  branchId?: string;
  vehicleId?: string | null;
  appointmentId?: string | null;
  quotationId?: string | null;
  requiresCustomerApproval?: boolean;
  dueAt?: string | null;
  customerMessage?: string | null;
  businessNotes?: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  platformFeeTotal: number;
  grandTotal: number;
  remainingTotal: number;
  items: InvoiceItemPersistenceInput[];
};

export type TransitionPersistenceInput = {
  invoiceId: string;
  fromStatus: InvoiceStatus;
  toStatus: InvoiceStatus;
  actorUserId: string;
  reason?: string | null;
  patch?: {
    issuedAt?: string | null;
    viewedAt?: string | null;
    customerApprovedAt?: string | null;
    paidAt?: string | null;
    cancelledAt?: string | null;
    paidTotal?: number;
    remainingTotal?: number;
  };
};

export type ListInvoicesFilters = {
  businessId?: string;
  customerId?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  from?: string;
  to?: string;
};

export type PaymentRecord = {
  id: string;
  paymentReference: string;
  invoiceId: string;
  customerId: string;
  businessId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type ListPaymentsFilters = {
  businessId?: string;
  customerId?: string;
  invoiceId?: string;
  from?: string;
  to?: string;
};

export type RecordCashPaymentResult = {
  paymentId: string;
  paymentReference: string;
  invoiceId: string;
  amount: number;
  previousStatus: InvoiceStatus;
  newStatus: InvoiceStatus;
  previousPaidTotal: number;
  paidTotal: number;
  remainingTotal: number;
  paidAt: string | null;
};
