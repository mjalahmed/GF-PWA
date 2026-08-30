import type {
  InvoiceItemType,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from "../../core/constants/statuses.ts";

export type InvoiceItemDto = {
  id: string;
  itemType: InvoiceItemType;
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

export type InvoiceResponseDto = {
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
  businessNotes?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItemDto[];
};

export type InvoiceItemInputDto = {
  itemType: InvoiceItemType;
  serviceId?: string | null;
  productId?: string | null;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discountAmount?: number | string;
  taxAmount?: number | string;
  sortOrder?: number;
};

export type CreateInvoiceRequestDto = {
  customerId: string;
  branchId: string;
  vehicleId?: string | null;
  appointmentId?: string | null;
  quotationId?: string | null;
  requiresCustomerApproval?: boolean;
  dueAt?: string | null;
  customerMessage?: string | null;
  businessNotes?: string | null;
  items: InvoiceItemInputDto[];
};

export type UpdateInvoiceRequestDto = {
  branchId?: string;
  vehicleId?: string | null;
  appointmentId?: string | null;
  requiresCustomerApproval?: boolean;
  dueAt?: string | null;
  customerMessage?: string | null;
  businessNotes?: string | null;
  items: InvoiceItemInputDto[];
};

export type CreateFromQuotationRequestDto = {
  requiresCustomerApproval?: boolean;
  dueAt?: string | null;
  customerMessage?: string | null;
  businessNotes?: string | null;
};

export type CreateFromAppointmentRequestDto = {
  vehicleId?: string | null;
  requiresCustomerApproval?: boolean;
  dueAt?: string | null;
  customerMessage?: string | null;
  businessNotes?: string | null;
  items?: InvoiceItemInputDto[];
};

export type TransitionRequestDto = {
  note?: string | null;
};

export type RecordCashPaymentRequestDto = {
  amount: number | string;
};

export type PaymentResponseDto = {
  id: string;
  paymentReference: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmedAt: string | null;
  createdAt: string;
  confirmedBy?: string | null;
};
