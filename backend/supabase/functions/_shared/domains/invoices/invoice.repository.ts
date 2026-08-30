import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import {
  InvoiceStatuses,
  type InvoiceItemType,
  type InvoiceStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "../../core/constants/statuses.ts";
import { mapInvoiceRpcError } from "./invoice.errors.ts";
import type { InvoiceRepository } from "./invoice.repository.interface.ts";
import type {
  CreateInvoicePersistenceInput,
  InvoiceItemRecord,
  InvoiceRecord,
  InvoiceStatusHistoryRecord,
  ListInvoicesFilters,
  ListPaymentsFilters,
  PaymentRecord,
  RecordCashPaymentResult,
  TransitionPersistenceInput,
  UpdateDraftPersistenceInput,
} from "./invoice.types.ts";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  customer_id: string;
  business_id: string;
  branch_id: string;
  vehicle_id: string | null;
  appointment_id: string | null;
  quotation_id: string | null;
  status: InvoiceStatus;
  subtotal: number | string;
  discount_total: number | string;
  tax_total: number | string;
  platform_fee_total: number | string;
  grand_total: number | string;
  paid_total: number | string;
  remaining_total: number | string;
  currency: string;
  requires_customer_approval: boolean;
  due_at: string | null;
  issued_at: string | null;
  viewed_at: string | null;
  customer_approved_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  customer_message: string | null;
  business_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type ItemRow = {
  id: string;
  invoice_id: string;
  item_type: InvoiceItemType;
  service_id: string | null;
  product_id: string | null;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  line_total: number | string;
  service_name_snapshot: string | null;
  product_name_snapshot: string | null;
  sku_snapshot: string | null;
  sort_order: number;
  created_at: string;
};

type HistoryRow = {
  id: string;
  invoice_id: string;
  previous_status: InvoiceStatus | null;
  new_status: InvoiceStatus;
  changed_by: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type PaymentRow = {
  id: string;
  payment_reference: string;
  invoice_id: string;
  customer_id: string;
  business_id: string;
  amount: number | string;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
};

const INVOICE_SELECT =
  "id, invoice_number, customer_id, business_id, branch_id, vehicle_id, appointment_id, quotation_id, status, subtotal, discount_total, tax_total, platform_fee_total, grand_total, paid_total, remaining_total, currency, requires_customer_approval, due_at, issued_at, viewed_at, customer_approved_at, paid_at, cancelled_at, customer_message, business_notes, created_by, created_at, updated_at";

const ITEM_SELECT =
  "id, invoice_id, item_type, service_id, product_id, description, quantity, unit_price, discount_amount, tax_amount, line_total, service_name_snapshot, product_name_snapshot, sku_snapshot, sort_order, created_at";

const PAYMENT_SELECT =
  "id, payment_reference, invoice_id, customer_id, business_id, amount, currency, method, status, confirmed_by, confirmed_at, created_at";

function num(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function toItem(row: ItemRow): InvoiceItemRecord {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    itemType: row.item_type,
    serviceId: row.service_id,
    productId: row.product_id,
    description: row.description,
    quantity: num(row.quantity),
    unitPrice: num(row.unit_price),
    discountAmount: num(row.discount_amount),
    taxAmount: num(row.tax_amount),
    lineTotal: num(row.line_total),
    serviceNameSnapshot: row.service_name_snapshot,
    productNameSnapshot: row.product_name_snapshot,
    skuSnapshot: row.sku_snapshot,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function toHistory(row: HistoryRow): InvoiceStatusHistoryRecord {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    changedBy: row.changed_by,
    reason: row.reason,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function toPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    paymentReference: row.payment_reference,
    invoiceId: row.invoice_id,
    customerId: row.customer_id,
    businessId: row.business_id,
    amount: num(row.amount),
    currency: row.currency,
    method: row.method,
    status: row.status,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  };
}

function toInvoice(
  row: InvoiceRow,
  items: InvoiceItemRecord[],
  history?: InvoiceStatusHistoryRecord[],
): InvoiceRecord {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    businessId: row.business_id,
    branchId: row.branch_id,
    vehicleId: row.vehicle_id,
    appointmentId: row.appointment_id,
    quotationId: row.quotation_id,
    status: row.status,
    subtotal: num(row.subtotal),
    discountTotal: num(row.discount_total),
    taxTotal: num(row.tax_total),
    platformFeeTotal: num(row.platform_fee_total),
    grandTotal: num(row.grand_total),
    paidTotal: num(row.paid_total),
    remainingTotal: num(row.remaining_total),
    currency: row.currency,
    requiresCustomerApproval: row.requires_customer_approval,
    dueAt: row.due_at,
    issuedAt: row.issued_at,
    viewedAt: row.viewed_at,
    customerApprovedAt: row.customer_approved_at,
    paidAt: row.paid_at,
    cancelledAt: row.cancelled_at,
    customerMessage: row.customer_message,
    businessNotes: row.business_notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    statusHistory: history,
  };
}

export class SupabaseInvoiceRepository implements InvoiceRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  private async nextInvoiceNumber(): Promise<string> {
    const { data, error } = await this.adminClient.rpc("next_invoice_number");
    if (error || !data) {
      throw new InternalError("Failed to allocate invoice number.", error);
    }
    return data as string;
  }

  private async loadItems(
    invoiceIds: string[],
  ): Promise<Map<string, InvoiceItemRecord[]>> {
    const map = new Map<string, InvoiceItemRecord[]>();
    if (invoiceIds.length === 0) return map;

    const { data, error } = await this.adminClient
      .from("invoice_items")
      .select(ITEM_SELECT)
      .in("invoice_id", invoiceIds)
      .order("sort_order", { ascending: true });

    if (error) throw new InternalError("Failed to load invoice items.", error);

    for (const row of (data ?? []) as ItemRow[]) {
      const list = map.get(row.invoice_id) ?? [];
      list.push(toItem(row));
      map.set(row.invoice_id, list);
    }
    return map;
  }

  private async loadHistory(
    invoiceId: string,
  ): Promise<InvoiceStatusHistoryRecord[]> {
    const { data, error } = await this.adminClient
      .from("invoice_status_history")
      .select(
        "id, invoice_id, previous_status, new_status, changed_by, reason, metadata, created_at",
      )
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });

    if (error) throw new InternalError("Failed to load invoice history.", error);
    return ((data ?? []) as HistoryRow[]).map(toHistory);
  }

  private async insertItems(
    invoiceId: string,
    items: CreateInvoicePersistenceInput["items"],
  ): Promise<InvoiceItemRecord[]> {
    const { data, error } = await this.adminClient
      .from("invoice_items")
      .insert(
        items.map((item) => ({
          invoice_id: invoiceId,
          item_type: item.itemType,
          service_id: item.serviceId,
          product_id: item.productId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: item.discountAmount,
          tax_amount: item.taxAmount,
          line_total: item.lineTotal,
          service_name_snapshot: item.serviceNameSnapshot,
          product_name_snapshot: item.productNameSnapshot,
          sku_snapshot: item.skuSnapshot,
          sort_order: item.sortOrder,
        })),
      )
      .select(ITEM_SELECT);

    if (error) throw new InternalError("Failed to create invoice items.", error);
    return ((data ?? []) as ItemRow[]).map(toItem);
  }

  private async writeHistory(input: {
    invoiceId: string;
    previousStatus: InvoiceStatus | null;
    newStatus: InvoiceStatus;
    changedBy: string;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.adminClient
      .from("invoice_status_history")
      .insert({
        invoice_id: input.invoiceId,
        previous_status: input.previousStatus,
        new_status: input.newStatus,
        changed_by: input.changedBy,
        reason: input.reason ?? null,
        metadata: input.metadata ?? {},
      });

    if (error) throw new InternalError("Failed to write invoice history.", error);
  }

  async findById(
    invoiceId: string,
    options?: { includeItems?: boolean; includeHistory?: boolean },
  ): Promise<InvoiceRecord | null> {
    const { data, error } = await this.adminClient
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("id", invoiceId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load invoice.", error);
    if (!data) return null;

    const includeItems = options?.includeItems !== false;
    const itemsMap = includeItems
      ? await this.loadItems([invoiceId])
      : new Map<string, InvoiceItemRecord[]>();
    const history = options?.includeHistory
      ? await this.loadHistory(invoiceId)
      : undefined;

    return toInvoice(
      data as InvoiceRow,
      includeItems ? itemsMap.get(invoiceId) ?? [] : [],
      history,
    );
  }

  async findByQuotationId(quotationId: string): Promise<InvoiceRecord | null> {
    const { data, error } = await this.adminClient
      .from("invoices")
      .select(INVOICE_SELECT)
      .eq("quotation_id", quotationId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load invoice by quotation.", error);
    if (!data) return null;

    const row = data as InvoiceRow;
    const itemsMap = await this.loadItems([row.id]);
    return toInvoice(row, itemsMap.get(row.id) ?? []);
  }

  async list(filters: ListInvoicesFilters): Promise<InvoiceRecord[]> {
    let query = this.adminClient
      .from("invoices")
      .select(INVOICE_SELECT)
      .order("created_at", { ascending: false });

    if (filters.businessId) query = query.eq("business_id", filters.businessId);
    if (filters.customerId) query = query.eq("customer_id", filters.customerId);
    if (filters.from) query = query.gte("created_at", filters.from);
    if (filters.to) query = query.lte("created_at", filters.to);
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        query = query.in("status", filters.status);
      } else {
        query = query.eq("status", filters.status);
      }
    }

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list invoices.", error);

    const rows = (data ?? []) as InvoiceRow[];
    const itemsMap = await this.loadItems(rows.map((r) => r.id));
    return rows.map((row) => toInvoice(row, itemsMap.get(row.id) ?? []));
  }

  async create(input: CreateInvoicePersistenceInput): Promise<InvoiceRecord> {
    const invoiceNumber = await this.nextInvoiceNumber();

    const { data, error } = await this.adminClient
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        customer_id: input.customerId,
        business_id: input.businessId,
        branch_id: input.branchId,
        vehicle_id: input.vehicleId,
        appointment_id: input.appointmentId,
        quotation_id: input.quotationId ?? null,
        status: input.status,
        subtotal: input.subtotal,
        discount_total: input.discountTotal,
        tax_total: input.taxTotal,
        platform_fee_total: input.platformFeeTotal,
        grand_total: input.grandTotal,
        paid_total: input.paidTotal,
        remaining_total: input.remainingTotal,
        requires_customer_approval: input.requiresCustomerApproval,
        due_at: input.dueAt,
        customer_message: input.customerMessage,
        business_notes: input.businessNotes,
        created_by: input.createdBy,
      })
      .select(INVOICE_SELECT)
      .single();

    if (error) throw new InternalError("Failed to create invoice.", error);

    const invoice = data as InvoiceRow;

    let items: InvoiceItemRecord[];
    try {
      items = await this.insertItems(invoice.id, input.items);
    } catch (err) {
      await this.adminClient.from("invoices").delete().eq("id", invoice.id);
      throw err;
    }

    await this.writeHistory({
      invoiceId: invoice.id,
      previousStatus: null,
      newStatus: input.status,
      changedBy: input.createdBy,
      reason: input.quotationId ? "created_from_quotation" : "created",
    });

    return toInvoice(invoice, items);
  }

  async updateDraft(input: UpdateDraftPersistenceInput): Promise<InvoiceRecord> {
    const patch: Record<string, unknown> = {
      subtotal: input.subtotal,
      discount_total: input.discountTotal,
      tax_total: input.taxTotal,
      platform_fee_total: input.platformFeeTotal,
      grand_total: input.grandTotal,
      remaining_total: input.remainingTotal,
    };

    if (input.branchId !== undefined) patch.branch_id = input.branchId;
    if (input.vehicleId !== undefined) patch.vehicle_id = input.vehicleId;
    if (input.appointmentId !== undefined) patch.appointment_id = input.appointmentId;
    if (input.quotationId !== undefined) patch.quotation_id = input.quotationId;
    if (input.requiresCustomerApproval !== undefined) {
      patch.requires_customer_approval = input.requiresCustomerApproval;
    }
    if (input.dueAt !== undefined) patch.due_at = input.dueAt;
    if (input.customerMessage !== undefined) {
      patch.customer_message = input.customerMessage;
    }
    if (input.businessNotes !== undefined) patch.business_notes = input.businessNotes;

    const { data, error } = await this.adminClient
      .from("invoices")
      .update(patch)
      .eq("id", input.invoiceId)
      .eq("status", InvoiceStatuses.Draft)
      .select(INVOICE_SELECT)
      .maybeSingle();

    if (error) throw new InternalError("Failed to update invoice.", error);
    if (!data) {
      throw new InternalError(
        "Invoice is not editable or changed concurrently.",
        { invoiceId: input.invoiceId },
      );
    }

    const { error: deleteError } = await this.adminClient
      .from("invoice_items")
      .delete()
      .eq("invoice_id", input.invoiceId);

    if (deleteError) {
      throw new InternalError("Failed to replace invoice items.", deleteError);
    }

    const items = await this.insertItems(input.invoiceId, input.items);
    return toInvoice(data as InvoiceRow, items);
  }

  async transition(input: TransitionPersistenceInput): Promise<InvoiceRecord> {
    const patch: Record<string, unknown> = {
      status: input.toStatus,
    };

    if (input.patch?.issuedAt !== undefined) patch.issued_at = input.patch.issuedAt;
    if (input.patch?.viewedAt !== undefined) patch.viewed_at = input.patch.viewedAt;
    if (input.patch?.customerApprovedAt !== undefined) {
      patch.customer_approved_at = input.patch.customerApprovedAt;
    }
    if (input.patch?.paidAt !== undefined) patch.paid_at = input.patch.paidAt;
    if (input.patch?.cancelledAt !== undefined) {
      patch.cancelled_at = input.patch.cancelledAt;
    }
    if (input.patch?.paidTotal !== undefined) patch.paid_total = input.patch.paidTotal;
    if (input.patch?.remainingTotal !== undefined) {
      patch.remaining_total = input.patch.remainingTotal;
    }

    const { data, error } = await this.adminClient
      .from("invoices")
      .update(patch)
      .eq("id", input.invoiceId)
      .eq("status", input.fromStatus)
      .select(INVOICE_SELECT)
      .maybeSingle();

    if (error) throw new InternalError("Failed to update invoice status.", error);
    if (!data) {
      throw new InternalError(
        "Invoice status changed concurrently.",
        { invoiceId: input.invoiceId },
      );
    }

    await this.writeHistory({
      invoiceId: input.invoiceId,
      previousStatus: input.fromStatus,
      newStatus: input.toStatus,
      changedBy: input.actorUserId,
      reason: input.reason ?? null,
    });

    const itemsMap = await this.loadItems([input.invoiceId]);
    return toInvoice(
      data as InvoiceRow,
      itemsMap.get(input.invoiceId) ?? [],
    );
  }

  async convertFromQuotation(input: {
    quotationId: string;
    createdBy: string;
    requiresCustomerApproval?: boolean;
    customerMessage?: string | null;
    businessNotes?: string | null;
    dueAt?: string | null;
    requestId?: string;
  }): Promise<string> {
    const { data, error } = await this.adminClient.rpc(
      "convert_accepted_quotation_to_invoice",
      {
        p_quotation_id: input.quotationId,
        p_created_by: input.createdBy,
        p_requires_customer_approval: input.requiresCustomerApproval ?? false,
        p_customer_message: input.customerMessage ?? null,
        p_business_notes: input.businessNotes ?? null,
        p_due_at: input.dueAt ?? null,
        p_request_id: input.requestId ?? null,
      },
    );

    if (error) {
      mapInvoiceRpcError(error.message ?? "Quotation conversion failed.");
    }

    return data as string;
  }

  async recordCashPayment(input: {
    invoiceId: string;
    amount: number;
    confirmedBy: string;
    requestId?: string;
    idempotencyKey?: string;
  }): Promise<RecordCashPaymentResult> {
    const { data, error } = await this.adminClient.rpc("record_cash_payment", {
      p_invoice_id: input.invoiceId,
      p_amount: input.amount,
      p_confirmed_by: input.confirmedBy,
      p_request_id: input.requestId ?? null,
      p_idempotency_key: input.idempotencyKey ?? null,
      p_metadata: {},
    });

    if (error) {
      mapInvoiceRpcError(error.message ?? "Cash payment failed.");
    }

    const result = data as Record<string, unknown>;
    return {
      paymentId: result.payment_id as string,
      paymentReference: result.payment_reference as string,
      invoiceId: result.invoice_id as string,
      amount: num(result.amount as number | string),
      previousStatus: result.previous_status as InvoiceStatus,
      newStatus: result.new_status as InvoiceStatus,
      previousPaidTotal: num(result.previous_paid_total as number | string),
      paidTotal: num(result.paid_total as number | string),
      remainingTotal: num(result.remaining_total as number | string),
      paidAt: (result.paid_at as string | null) ?? null,
    };
  }

  async findPaymentById(paymentId: string): Promise<PaymentRecord | null> {
    const { data, error } = await this.adminClient
      .from("payments")
      .select(PAYMENT_SELECT)
      .eq("id", paymentId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load payment.", error);
    if (!data) return null;
    return toPayment(data as PaymentRow);
  }

  async listPayments(filters: ListPaymentsFilters): Promise<PaymentRecord[]> {
    let query = this.adminClient
      .from("payments")
      .select(PAYMENT_SELECT)
      .order("created_at", { ascending: false });

    if (filters.businessId) query = query.eq("business_id", filters.businessId);
    if (filters.customerId) query = query.eq("customer_id", filters.customerId);
    if (filters.invoiceId) query = query.eq("invoice_id", filters.invoiceId);
    if (filters.from) query = query.gte("created_at", filters.from);
    if (filters.to) query = query.lte("created_at", filters.to);

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list payments.", error);
    return ((data ?? []) as PaymentRow[]).map(toPayment);
  }
}
