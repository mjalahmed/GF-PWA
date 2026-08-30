import type {
  CreateInvoicePersistenceInput,
  InvoiceRecord,
  ListInvoicesFilters,
  ListPaymentsFilters,
  PaymentRecord,
  RecordCashPaymentResult,
  TransitionPersistenceInput,
  UpdateDraftPersistenceInput,
} from "./invoice.types.ts";

export interface InvoiceRepository {
  findById(
    invoiceId: string,
    options?: { includeItems?: boolean; includeHistory?: boolean },
  ): Promise<InvoiceRecord | null>;
  findByQuotationId(quotationId: string): Promise<InvoiceRecord | null>;
  list(filters: ListInvoicesFilters): Promise<InvoiceRecord[]>;
  create(input: CreateInvoicePersistenceInput): Promise<InvoiceRecord>;
  updateDraft(input: UpdateDraftPersistenceInput): Promise<InvoiceRecord>;
  transition(input: TransitionPersistenceInput): Promise<InvoiceRecord>;
  convertFromQuotation(input: {
    quotationId: string;
    createdBy: string;
    requiresCustomerApproval?: boolean;
    customerMessage?: string | null;
    businessNotes?: string | null;
    dueAt?: string | null;
    requestId?: string;
  }): Promise<string>;
  recordCashPayment(input: {
    invoiceId: string;
    amount: number;
    confirmedBy: string;
    requestId?: string;
    idempotencyKey?: string;
  }): Promise<RecordCashPaymentResult>;
  findPaymentById(paymentId: string): Promise<PaymentRecord | null>;
  listPayments(filters: ListPaymentsFilters): Promise<PaymentRecord[]>;
}
