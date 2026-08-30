import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import {
  QuotationStatuses,
  type QuotationItemType,
  type QuotationStatus,
} from "../../core/constants/statuses.ts";
import type { QuotationRepository } from "./quotation.repository.interface.ts";
import type {
  CreateQuotationPersistenceInput,
  ListQuotationsFilters,
  QuotationItemRecord,
  QuotationRecord,
  QuotationStatusHistoryRecord,
  TransitionPersistenceInput,
  UpdateDraftPersistenceInput,
} from "./quotation.types.ts";
import { QuotationRevisionConflictError } from "./quotation.errors.ts";

type QuotationRow = {
  id: string;
  quotation_number: string;
  customer_id: string;
  business_id: string;
  branch_id: string;
  vehicle_id: string | null;
  appointment_id: string | null;
  root_quotation_id: string | null;
  previous_revision_id: string | null;
  revision_number: number;
  status: QuotationStatus;
  subtotal: number | string;
  discount_total: number | string;
  tax_total: number | string;
  grand_total: number | string;
  currency: string;
  valid_until: string | null;
  customer_message: string | null;
  business_notes: string | null;
  issued_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type ItemRow = {
  id: string;
  quotation_id: string;
  item_type: QuotationItemType;
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
  quotation_id: string;
  from_status: QuotationStatus | null;
  to_status: QuotationStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};

const QUOTATION_SELECT =
  "id, quotation_number, customer_id, business_id, branch_id, vehicle_id, appointment_id, root_quotation_id, previous_revision_id, revision_number, status, subtotal, discount_total, tax_total, grand_total, currency, valid_until, customer_message, business_notes, issued_at, viewed_at, accepted_at, rejected_at, cancelled_at, created_by, created_at, updated_at";

const ITEM_SELECT =
  "id, quotation_id, item_type, service_id, product_id, description, quantity, unit_price, discount_amount, tax_amount, line_total, service_name_snapshot, product_name_snapshot, sku_snapshot, sort_order, created_at";

const HISTORY_SELECT =
  "id, quotation_id, from_status, to_status, changed_by, note, created_at";

function num(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function toItem(row: ItemRow): QuotationItemRecord {
  return {
    id: row.id,
    quotationId: row.quotation_id,
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

function toHistory(row: HistoryRow): QuotationStatusHistoryRecord {
  return {
    id: row.id,
    quotationId: row.quotation_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedBy: row.changed_by,
    note: row.note,
    createdAt: row.created_at,
  };
}

function toQuotation(
  row: QuotationRow,
  items: QuotationItemRecord[],
  history?: QuotationStatusHistoryRecord[],
): QuotationRecord {
  return {
    id: row.id,
    quotationNumber: row.quotation_number,
    customerId: row.customer_id,
    businessId: row.business_id,
    branchId: row.branch_id,
    vehicleId: row.vehicle_id,
    appointmentId: row.appointment_id,
    rootQuotationId: row.root_quotation_id ?? row.id,
    previousRevisionId: row.previous_revision_id,
    revisionNumber: row.revision_number,
    status: row.status,
    subtotal: num(row.subtotal),
    discountTotal: num(row.discount_total),
    taxTotal: num(row.tax_total),
    grandTotal: num(row.grand_total),
    currency: row.currency,
    validUntil: row.valid_until,
    customerMessage: row.customer_message,
    businessNotes: row.business_notes,
    issuedAt: row.issued_at,
    viewedAt: row.viewed_at,
    acceptedAt: row.accepted_at,
    rejectedAt: row.rejected_at,
    cancelledAt: row.cancelled_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items,
    statusHistory: history,
  };
}

export class SupabaseQuotationRepository implements QuotationRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  private async nextQuotationNumber(): Promise<string> {
    const { data, error } = await this.adminClient.rpc("next_quotation_number");
    if (error || !data) {
      throw new InternalError("Failed to allocate quotation number.", error);
    }
    return data as string;
  }

  private async loadItems(
    quotationIds: string[],
  ): Promise<Map<string, QuotationItemRecord[]>> {
    const map = new Map<string, QuotationItemRecord[]>();
    if (quotationIds.length === 0) return map;

    const { data, error } = await this.adminClient
      .from("quotation_items")
      .select(ITEM_SELECT)
      .in("quotation_id", quotationIds)
      .order("sort_order", { ascending: true });

    if (error) throw new InternalError("Failed to load quotation items.", error);

    for (const row of (data ?? []) as ItemRow[]) {
      const list = map.get(row.quotation_id) ?? [];
      list.push(toItem(row));
      map.set(row.quotation_id, list);
    }
    return map;
  }

  private async loadHistory(
    quotationId: string,
  ): Promise<QuotationStatusHistoryRecord[]> {
    const { data, error } = await this.adminClient
      .from("quotation_status_history")
      .select(HISTORY_SELECT)
      .eq("quotation_id", quotationId)
      .order("created_at", { ascending: true });

    if (error) throw new InternalError("Failed to load quotation history.", error);
    return ((data ?? []) as HistoryRow[]).map(toHistory);
  }

  private async insertItems(
    quotationId: string,
    items: CreateQuotationPersistenceInput["items"],
  ): Promise<QuotationItemRecord[]> {
    const { data, error } = await this.adminClient
      .from("quotation_items")
      .insert(
        items.map((item) => ({
          quotation_id: quotationId,
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

    if (error) throw new InternalError("Failed to create quotation items.", error);
    return ((data ?? []) as ItemRow[]).map(toItem);
  }

  private async writeHistory(input: {
    quotationId: string;
    fromStatus: QuotationStatus | null;
    toStatus: QuotationStatus;
    changedBy: string;
    note?: string | null;
  }): Promise<void> {
    const { error } = await this.adminClient
      .from("quotation_status_history")
      .insert({
        quotation_id: input.quotationId,
        from_status: input.fromStatus,
        to_status: input.toStatus,
        changed_by: input.changedBy,
        note: input.note ?? null,
      });

    if (error) throw new InternalError("Failed to write quotation history.", error);
  }

  async findById(
    quotationId: string,
    options?: { includeItems?: boolean; includeHistory?: boolean },
  ): Promise<QuotationRecord | null> {
    const { data, error } = await this.adminClient
      .from("quotations")
      .select(QUOTATION_SELECT)
      .eq("id", quotationId)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load quotation.", error);
    if (!data) return null;

    const includeItems = options?.includeItems !== false;
    const itemsMap = includeItems
      ? await this.loadItems([quotationId])
      : new Map<string, QuotationItemRecord[]>();
    const history = options?.includeHistory
      ? await this.loadHistory(quotationId)
      : undefined;

    return toQuotation(
      data as QuotationRow,
      includeItems ? itemsMap.get(quotationId) ?? [] : [],
      history,
    );
  }

  async list(filters: ListQuotationsFilters): Promise<QuotationRecord[]> {
    let query = this.adminClient
      .from("quotations")
      .select(QUOTATION_SELECT)
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
    if (error) throw new InternalError("Failed to list quotations.", error);

    const rows = (data ?? []) as QuotationRow[];
    const itemsMap = await this.loadItems(rows.map((r) => r.id));
    return rows.map((row) =>
      toQuotation(row, itemsMap.get(row.id) ?? [])
    );
  }

  async listRevisions(rootQuotationId: string): Promise<QuotationRecord[]> {
    const { data, error } = await this.adminClient
      .from("quotations")
      .select(QUOTATION_SELECT)
      .eq("root_quotation_id", rootQuotationId)
      .order("revision_number", { ascending: true });

    if (error) throw new InternalError("Failed to list quotation revisions.", error);

    const rows = (data ?? []) as QuotationRow[];
    const itemsMap = await this.loadItems(rows.map((r) => r.id));
    return rows.map((row) =>
      toQuotation(row, itemsMap.get(row.id) ?? [])
    );
  }

  async create(input: CreateQuotationPersistenceInput): Promise<QuotationRecord> {
    const quotationNumber = await this.nextQuotationNumber();

    const { data, error } = await this.adminClient
      .from("quotations")
      .insert({
        quotation_number: quotationNumber,
        customer_id: input.customerId,
        business_id: input.businessId,
        branch_id: input.branchId,
        vehicle_id: input.vehicleId,
        appointment_id: input.appointmentId,
        previous_revision_id: input.previousRevisionId ?? null,
        revision_number: input.revisionNumber ?? 1,
        status: input.status,
        subtotal: input.subtotal,
        discount_total: input.discountTotal,
        tax_total: input.taxTotal,
        grand_total: input.grandTotal,
        valid_until: input.validUntil,
        customer_message: input.customerMessage,
        business_notes: input.businessNotes,
        created_by: input.createdBy,
      })
      .select(QUOTATION_SELECT)
      .single();

    if (error) throw new InternalError("Failed to create quotation.", error);

    const quotation = data as QuotationRow;

    if (input.rootQuotationId) {
      const { error: rootError } = await this.adminClient
        .from("quotations")
        .update({ root_quotation_id: input.rootQuotationId })
        .eq("id", quotation.id);
      if (rootError) {
        await this.adminClient.from("quotations").delete().eq("id", quotation.id);
        throw new InternalError("Failed to set quotation root id.", rootError);
      }
      quotation.root_quotation_id = input.rootQuotationId;
    }

    let items: QuotationItemRecord[];
    try {
      items = await this.insertItems(quotation.id, input.items);
    } catch (err) {
      await this.adminClient.from("quotations").delete().eq("id", quotation.id);
      throw err;
    }

    await this.writeHistory({
      quotationId: quotation.id,
      fromStatus: null,
      toStatus: input.status,
      changedBy: input.createdBy,
      note: input.previousRevisionId ? "revision_created" : "created",
    });

    return toQuotation(quotation, items);
  }

  async updateDraft(input: UpdateDraftPersistenceInput): Promise<QuotationRecord> {
    const patch: Record<string, unknown> = {
      subtotal: input.subtotal,
      discount_total: input.discountTotal,
      tax_total: input.taxTotal,
      grand_total: input.grandTotal,
    };

    if (input.branchId !== undefined) patch.branch_id = input.branchId;
    if (input.vehicleId !== undefined) patch.vehicle_id = input.vehicleId;
    if (input.appointmentId !== undefined) patch.appointment_id = input.appointmentId;
    if (input.validUntil !== undefined) patch.valid_until = input.validUntil;
    if (input.customerMessage !== undefined) {
      patch.customer_message = input.customerMessage;
    }
    if (input.businessNotes !== undefined) patch.business_notes = input.businessNotes;

    const { data, error } = await this.adminClient
      .from("quotations")
      .update(patch)
      .eq("id", input.quotationId)
      .eq("status", QuotationStatuses.Draft)
      .select(QUOTATION_SELECT)
      .maybeSingle();

    if (error) throw new InternalError("Failed to update quotation.", error);
    if (!data) {
      throw new InternalError(
        "Quotation is not editable or changed concurrently.",
        { quotationId: input.quotationId },
      );
    }

    const { error: deleteError } = await this.adminClient
      .from("quotation_items")
      .delete()
      .eq("quotation_id", input.quotationId);

    if (deleteError) {
      throw new InternalError("Failed to replace quotation items.", deleteError);
    }

    const items = await this.insertItems(input.quotationId, input.items);
    return toQuotation(data as QuotationRow, items);
  }

  async transition(input: TransitionPersistenceInput): Promise<QuotationRecord> {
    const patch: Record<string, unknown> = {
      status: input.toStatus,
    };

    if (input.patch?.issuedAt !== undefined) patch.issued_at = input.patch.issuedAt;
    if (input.patch?.viewedAt !== undefined) patch.viewed_at = input.patch.viewedAt;
    if (input.patch?.acceptedAt !== undefined) {
      patch.accepted_at = input.patch.acceptedAt;
    }
    if (input.patch?.rejectedAt !== undefined) {
      patch.rejected_at = input.patch.rejectedAt;
    }
    if (input.patch?.cancelledAt !== undefined) {
      patch.cancelled_at = input.patch.cancelledAt;
    }

    const { data, error } = await this.adminClient
      .from("quotations")
      .update(patch)
      .eq("id", input.quotationId)
      .eq("status", input.fromStatus)
      .select(QUOTATION_SELECT)
      .maybeSingle();

    if (error) throw new InternalError("Failed to update quotation status.", error);
    if (!data) {
      throw new InternalError(
        "Quotation status changed concurrently.",
        { quotationId: input.quotationId },
      );
    }

    await this.writeHistory({
      quotationId: input.quotationId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      changedBy: input.actorUserId,
      note: input.note ?? null,
    });

    const itemsMap = await this.loadItems([input.quotationId]);
    return toQuotation(
      data as QuotationRow,
      itemsMap.get(input.quotationId) ?? [],
    );
  }

  async revise(fromId: string, createdBy: string): Promise<QuotationRecord> {
    const source = await this.findById(fromId, { includeItems: true });
    if (!source) {
      throw new InternalError("Source quotation was not found.", { fromId });
    }

    if (source.status === QuotationStatuses.Accepted) {
      throw new QuotationRevisionConflictError(
        "Accepted quotations cannot be revised.",
      );
    }

    const rootId = source.rootQuotationId;
    const revisions = await this.listRevisions(rootId);
    const maxRevision = revisions.reduce(
      (max, row) => Math.max(max, row.revisionNumber),
      0,
    );

    const hasOpenDraft = revisions.some(
      (row) => row.status === QuotationStatuses.Draft,
    );
    if (hasOpenDraft) {
      throw new QuotationRevisionConflictError(
        "A draft revision already exists for this quotation.",
      );
    }

    return this.create({
      customerId: source.customerId,
      businessId: source.businessId,
      branchId: source.branchId,
      vehicleId: source.vehicleId,
      appointmentId: source.appointmentId,
      status: QuotationStatuses.Draft,
      subtotal: source.subtotal,
      discountTotal: source.discountTotal,
      taxTotal: source.taxTotal,
      grandTotal: source.grandTotal,
      validUntil: source.validUntil,
      customerMessage: source.customerMessage,
      businessNotes: source.businessNotes,
      createdBy,
      rootQuotationId: rootId,
      previousRevisionId: source.id,
      revisionNumber: maxRevision + 1,
      items: source.items.map((item) => ({
        itemType: item.itemType,
        serviceId: item.serviceId,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxAmount: item.taxAmount,
        lineTotal: item.lineTotal,
        serviceNameSnapshot: item.serviceNameSnapshot,
        productNameSnapshot: item.productNameSnapshot,
        skuSnapshot: item.skuSnapshot,
        sortOrder: item.sortOrder,
      })),
    });
  }
}
