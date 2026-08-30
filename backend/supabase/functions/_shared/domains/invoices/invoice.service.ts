import {
  BusinessStatuses,
  InvoiceItemTypes,
  InvoiceStatuses,
  type InvoiceStatus,
} from "../../core/constants/statuses.ts";
import { ValidationError } from "../../core/errors/app-error.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BranchRepository } from "../business-management/branch.repository.interface.ts";
import type { BusinessRepository } from "../business-management/business.repository.interface.ts";
import type { MembershipRepository } from "../business-management/membership.repository.interface.ts";
import type { ProductRepository } from "../catalog/product.repository.interface.ts";
import type { ServiceRepository } from "../catalog/service.repository.interface.ts";
import type { VehicleRepository } from "../vehicles/vehicle.repository.interface.ts";
import type { AppointmentRepository } from "../appointments/appointment.repository.interface.ts";
import type { QuotationRepository } from "../quotations/quotation.repository.interface.ts";
import {
  calculateLine,
  calculateTotals,
  formatMoney,
  formatQuantity,
} from "../quotations/quotation.money.ts";
import type {
  CreateFromAppointmentRequestDto,
  CreateFromQuotationRequestDto,
  CreateInvoiceRequestDto,
  InvoiceItemInputDto,
  InvoiceResponseDto,
  PaymentResponseDto,
  RecordCashPaymentRequestDto,
  TransitionRequestDto,
  UpdateInvoiceRequestDto,
} from "./invoice.dto.ts";
import {
  CashPaymentsDisabledError,
  InvoiceAccessDeniedError,
  InvoiceAlreadyPaidError,
  InvoiceItemInvalidError,
  InvoiceNotEditableError,
  InvoiceNotFoundError,
  InvoicesDisabledError,
  PaymentAccessDeniedError,
  PaymentNotFoundError,
  wrapMoneyError,
} from "./invoice.errors.ts";
import { InvoiceMapper } from "./invoice.mapper.ts";
import type { InvoiceRepository } from "./invoice.repository.interface.ts";
import {
  assertTransition,
  CANCELLABLE_STATUSES,
  validateCashPaymentAmount,
} from "./invoice.transitions.ts";
import type {
  InvoiceItemPersistenceInput,
  InvoiceRecord,
} from "./invoice.types.ts";

type ActorContext = {
  userId: string;
  roles?: string[];
  globalPermissions?: string[];
};

export class InvoiceService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly branchRepository: BranchRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly productRepository: ProductRepository,
    private readonly vehicleRepository: VehicleRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  private async safeNotify(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.businessRepository.insertNotification({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: "invoice",
        entityId: input.entityId,
        metadata: input.metadata ?? {},
      });
    } catch {
      // Notifications must not roll back invoice mutations.
    }
  }

  private async notifyBusinessStaff(
    businessId: string,
    input: {
      type: string;
      title: string;
      body: string;
      entityId: string;
      excludeUserId?: string;
    },
  ): Promise<void> {
    try {
      const members = await this.membershipRepository.listByBusiness(businessId);
      for (const m of members) {
        if (m.status !== "active") continue;
        if (input.excludeUserId && m.userId === input.excludeUserId) continue;
        if (m.role !== "owner" && m.role !== "manager") continue;
        await this.safeNotify({
          userId: m.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          entityId: input.entityId,
        });
      }
    } catch {
      // best-effort
    }
  }

  private isBusinessViewer(actor: ActorContext, invoice: InvoiceRecord): boolean {
    if (invoice.customerId === actor.userId) return false;
    const roles = actor.roles ?? [];
    return roles.includes("admin") || roles.includes("super_admin");
  }

  private toInvoiceDto(
    record: InvoiceRecord,
    actor: ActorContext,
  ): InvoiceResponseDto {
    const includeBusinessNotes = record.customerId !== actor.userId ||
      this.isBusinessViewer(actor, record);
    return InvoiceMapper.toDto(record, { includeBusinessNotes });
  }

  private toPaymentDto(
    record: Parameters<typeof InvoiceMapper.toPaymentDto>[0],
    actor: ActorContext,
    invoice: InvoiceRecord,
  ): PaymentResponseDto {
    const includeConfirmedBy = invoice.customerId !== actor.userId ||
      this.isBusinessViewer(actor, invoice);
    return InvoiceMapper.toPaymentDto(record, { includeConfirmedBy });
  }

  private async loadAccessibleInvoice(
    actor: ActorContext,
    invoiceId: string,
  ): Promise<InvoiceRecord> {
    const invoice = await this.invoiceRepository.findById(invoiceId, {
      includeItems: true,
    });
    if (!invoice) throw new InvoiceNotFoundError(invoiceId);

    if (invoice.customerId === actor.userId) return invoice;

    const membership = await this.businessRepository.findActiveMembership(
      invoice.businessId,
      actor.userId,
    );
    if (membership) return invoice;

    const roles = actor.roles ?? [];
    if (roles.includes("admin") || roles.includes("super_admin")) {
      return invoice;
    }

    throw new InvoiceAccessDeniedError();
  }

  private async loadAccessiblePayment(
    actor: ActorContext,
    paymentId: string,
  ): Promise<{ payment: NonNullable<Awaited<ReturnType<InvoiceRepository["findPaymentById"]>>>; invoice: InvoiceRecord }> {
    const payment = await this.invoiceRepository.findPaymentById(paymentId);
    if (!payment) throw new PaymentNotFoundError(paymentId);

    const invoice = await this.loadAccessibleInvoice(actor, payment.invoiceId);
    if (
      invoice.customerId !== actor.userId &&
      payment.businessId !== invoice.businessId
    ) {
      throw new PaymentAccessDeniedError();
    }

    return { payment, invoice };
  }

  private async assertInvoicesEnabled(businessId: string): Promise<void> {
    const settings = await this.businessRepository.findSettings(
      businessId,
      "admin",
    );
    if (!settings?.invoicesEnabled) throw new InvoicesDisabledError();
  }

  private async assertCashPaymentsEnabled(businessId: string): Promise<void> {
    const settings = await this.businessRepository.findSettings(
      businessId,
      "admin",
    );
    if (!settings?.cashPaymentsEnabled) throw new CashPaymentsDisabledError();
  }

  private async assertActiveBusinessContext(
    businessId: string,
    branchId: string,
  ): Promise<void> {
    const business = await this.businessRepository.findById(businessId, "admin");
    if (!business || business.status !== BusinessStatuses.Active) {
      throw new ValidationError("Business is not available.");
    }

    const branch = await this.branchRepository.findById(businessId, branchId);
    if (!branch || !branch.isActive) {
      throw new ValidationError("Branch is not available.");
    }
  }

  private async resolveItems(
    businessId: string,
    items: InvoiceItemInputDto[],
  ): Promise<InvoiceItemPersistenceInput[]> {
    const resolved: InvoiceItemPersistenceInput[] = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index]!;
      let line;
      try {
        line = calculateLine({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxAmount: item.taxAmount,
        });
      } catch (err) {
        wrapMoneyError(err);
      }

      let serviceId: string | null = item.serviceId ?? null;
      let productId: string | null = item.productId ?? null;
      let serviceNameSnapshot: string | null = null;
      let productNameSnapshot: string | null = null;
      let skuSnapshot: string | null = null;

      if (item.itemType === InvoiceItemTypes.Service) {
        if (!serviceId) {
          throw new InvoiceItemInvalidError("Service items require serviceId.");
        }
        const service = await this.serviceRepository.findById(
          businessId,
          serviceId,
        );
        if (!service || !service.isActive) {
          throw new InvoiceItemInvalidError("Linked service is not available.");
        }
        serviceNameSnapshot = service.name;
      } else if (item.itemType === InvoiceItemTypes.Product) {
        if (!productId) {
          throw new InvoiceItemInvalidError("Product items require productId.");
        }
        const product = await this.productRepository.findById(
          businessId,
          productId,
        );
        if (!product || !product.isActive) {
          throw new InvoiceItemInvalidError("Linked product is not available.");
        }
        productNameSnapshot = product.name;
        skuSnapshot = product.sku;
      } else {
        serviceId = null;
        productId = null;
      }

      resolved.push({
        itemType: item.itemType,
        serviceId,
        productId,
        description: item.description,
        quantity: formatQuantity(line.quantityMilli),
        unitPrice: formatMoney(line.unitPriceFils),
        discountAmount: formatMoney(line.discountFils),
        taxAmount: formatMoney(line.taxFils),
        lineTotal: formatMoney(line.lineTotalFils),
        serviceNameSnapshot,
        productNameSnapshot,
        skuSnapshot,
        sortOrder: item.sortOrder ?? index,
      });
    }

    return resolved;
  }

  private buildTotals(items: InvoiceItemPersistenceInput[]) {
    const lines = items.map((item) =>
      calculateLine({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxAmount: item.taxAmount,
      })
    );
    const totals = calculateTotals(lines);
    const platformFeeTotal = 0;
    return {
      items,
      subtotal: formatMoney(totals.subtotalFils),
      discountTotal: formatMoney(totals.discountTotalFils),
      taxTotal: formatMoney(totals.taxTotalFils),
      platformFeeTotal,
      grandTotal: formatMoney(totals.grandTotalFils),
    };
  }

  private async validateLinks(input: {
    businessId: string;
    branchId: string;
    customerId: string;
    vehicleId?: string | null;
    appointmentId?: string | null;
    quotationId?: string | null;
  }): Promise<void> {
    if (input.appointmentId) {
      const appointment = await this.appointmentRepository.findById(
        input.appointmentId,
      );
      if (!appointment) {
        throw new ValidationError("Linked appointment was not found.");
      }
      if (
        appointment.customerId !== input.customerId ||
        appointment.businessId !== input.businessId ||
        appointment.branchId !== input.branchId
      ) {
        throw new ValidationError(
          "Appointment must match invoice customer, business, and branch.",
        );
      }
    }

    if (input.quotationId) {
      const quotation = await this.quotationRepository.findById(
        input.quotationId,
      );
      if (!quotation) {
        throw new ValidationError("Linked quotation was not found.");
      }
      if (
        quotation.customerId !== input.customerId ||
        quotation.businessId !== input.businessId
      ) {
        throw new ValidationError(
          "Quotation must match invoice customer and business.",
        );
      }
    }

    if (input.vehicleId) {
      const vehicle = await this.vehicleRepository.findById(input.vehicleId);
      if (!vehicle || vehicle.customerId !== input.customerId || !vehicle.isActive) {
        throw new ValidationError("Vehicle must belong to the customer.");
      }
    }
  }

  async listForActor(
    actor: ActorContext,
    filters: {
      status?: InvoiceStatus | InvoiceStatus[];
      from?: string;
      to?: string;
      businessId?: string;
    },
  ): Promise<InvoiceResponseDto[]> {
    const rows = await this.invoiceRepository.list({
      customerId: actor.userId,
      businessId: filters.businessId,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    });
    return rows.map((row) => this.toInvoiceDto(row, actor));
  }

  async listForBusiness(
    businessId: string,
    actor: ActorContext,
    filters: {
      status?: InvoiceStatus | InvoiceStatus[];
      from?: string;
      to?: string;
      customerId?: string;
    },
  ): Promise<InvoiceResponseDto[]> {
    const rows = await this.invoiceRepository.list({
      businessId,
      customerId: filters.customerId,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    });
    return rows.map((row) => this.toInvoiceDto(row, actor));
  }

  async getById(
    actor: ActorContext,
    invoiceId: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.loadAccessibleInvoice(actor, invoiceId);
    return this.toInvoiceDto(invoice, actor);
  }

  async create(
    actor: ActorContext,
    businessId: string,
    input: CreateInvoiceRequestDto,
    requestId?: string,
  ): Promise<InvoiceResponseDto> {
    await this.assertInvoicesEnabled(businessId);
    await this.assertActiveBusinessContext(businessId, input.branchId);
    await this.validateLinks({
      businessId,
      branchId: input.branchId,
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      appointmentId: input.appointmentId,
      quotationId: input.quotationId,
    });

    const resolvedItems = await this.resolveItems(businessId, input.items);
    const totals = this.buildTotals(resolvedItems);

    const invoice = await this.invoiceRepository.create({
      customerId: input.customerId,
      businessId,
      branchId: input.branchId,
      vehicleId: input.vehicleId ?? null,
      appointmentId: input.appointmentId ?? null,
      quotationId: input.quotationId ?? null,
      status: InvoiceStatuses.Draft,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      platformFeeTotal: totals.platformFeeTotal,
      grandTotal: totals.grandTotal,
      paidTotal: 0,
      remainingTotal: totals.grandTotal,
      requiresCustomerApproval: input.requiresCustomerApproval ?? false,
      dueAt: input.dueAt ?? null,
      customerMessage: input.customerMessage ?? null,
      businessNotes: input.businessNotes ?? null,
      createdBy: actor.userId,
      items: totals.items,
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "invoice.created",
      entityType: "invoice",
      entityId: invoice.id,
      requestId,
      newValues: { status: InvoiceStatuses.Draft, businessId },
    });

    return this.toInvoiceDto(invoice, actor);
  }

  async createFromAppointment(
    actor: ActorContext,
    businessId: string,
    appointmentId: string,
    input?: CreateFromAppointmentRequestDto,
    requestId?: string,
  ): Promise<InvoiceResponseDto> {
    const appointment = await this.appointmentRepository.findById(appointmentId);
    if (!appointment || appointment.businessId !== businessId) {
      throw new ValidationError("Appointment was not found for this business.");
    }

    const items: InvoiceItemInputDto[] = input?.items?.length
      ? input.items
      : appointment.services.map((service, index) => ({
        itemType: InvoiceItemTypes.Service,
        serviceId: service.serviceId,
        description: service.serviceNameSnapshot,
        quantity: 1,
        unitPrice: service.quotedPrice ?? 0,
        sortOrder: index,
      }));

    if (items.length === 0) {
      throw new ValidationError("Appointment has no services to invoice.");
    }

    const invoice = await this.create(
      actor,
      businessId,
      {
        customerId: appointment.customerId,
        branchId: appointment.branchId,
        vehicleId: input?.vehicleId !== undefined
          ? input.vehicleId
          : appointment.vehicleId,
        appointmentId: appointment.id,
        requiresCustomerApproval: input?.requiresCustomerApproval,
        dueAt: input?.dueAt,
        customerMessage: input?.customerMessage,
        businessNotes: input?.businessNotes,
        items,
      },
      requestId,
    );

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "invoice.created_from_appointment",
      entityType: "invoice",
      entityId: invoice.id,
      requestId,
      newValues: { appointmentId },
    });

    return invoice;
  }

  async createFromQuotation(
    actor: ActorContext,
    businessId: string,
    quotationId: string,
    input?: CreateFromQuotationRequestDto,
    requestId?: string,
  ): Promise<InvoiceResponseDto> {
    await this.assertInvoicesEnabled(businessId);

    const quotation = await this.quotationRepository.findById(quotationId);
    if (!quotation || quotation.businessId !== businessId) {
      throw new ValidationError("Quotation was not found for this business.");
    }

    const existing = await this.invoiceRepository.findByQuotationId(quotationId);
    if (existing) {
      return this.toInvoiceDto(existing, actor);
    }

    const invoiceId = await this.invoiceRepository.convertFromQuotation({
      quotationId,
      createdBy: actor.userId,
      requiresCustomerApproval: input?.requiresCustomerApproval,
      customerMessage: input?.customerMessage,
      businessNotes: input?.businessNotes,
      dueAt: input?.dueAt,
      requestId,
    });

    const invoice = await this.invoiceRepository.findById(invoiceId, {
      includeItems: true,
    });
    if (!invoice) throw new InvoiceNotFoundError(invoiceId);

    return this.toInvoiceDto(invoice, actor);
  }

  async updateDraft(
    actor: ActorContext,
    businessId: string,
    invoiceId: string,
    input: UpdateInvoiceRequestDto,
    requestId?: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.loadAccessibleInvoice(actor, invoiceId);
    if (invoice.businessId !== businessId) {
      throw new InvoiceAccessDeniedError();
    }
    if (invoice.status !== InvoiceStatuses.Draft) {
      throw new InvoiceNotEditableError();
    }

    const branchId = input.branchId ?? invoice.branchId;
    await this.assertActiveBusinessContext(businessId, branchId);
    await this.validateLinks({
      businessId,
      branchId,
      customerId: invoice.customerId,
      vehicleId: input.vehicleId ?? invoice.vehicleId,
      appointmentId: input.appointmentId ?? invoice.appointmentId,
      quotationId: invoice.quotationId,
    });

    const resolvedItems = await this.resolveItems(businessId, input.items);
    const totals = this.buildTotals(resolvedItems);

    const updated = await this.invoiceRepository.updateDraft({
      invoiceId,
      branchId: input.branchId,
      vehicleId: input.vehicleId,
      appointmentId: input.appointmentId,
      requiresCustomerApproval: input.requiresCustomerApproval,
      dueAt: input.dueAt,
      customerMessage: input.customerMessage,
      businessNotes: input.businessNotes,
      subtotal: totals.subtotal,
      discountTotal: totals.discountTotal,
      taxTotal: totals.taxTotal,
      platformFeeTotal: totals.platformFeeTotal,
      grandTotal: totals.grandTotal,
      remainingTotal: totals.grandTotal,
      items: totals.items,
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "invoice.updated",
      entityType: "invoice",
      entityId: invoiceId,
      requestId,
    });

    return this.toInvoiceDto(updated, actor);
  }

  async issue(
    actor: ActorContext,
    businessId: string,
    invoiceId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.loadAccessibleInvoice(actor, invoiceId);
    if (invoice.businessId !== businessId) {
      throw new InvoiceAccessDeniedError();
    }
    if (invoice.status !== InvoiceStatuses.Draft) {
      throw new InvoiceNotEditableError("Only draft invoices can be issued.");
    }

    assertTransition(invoice.status, InvoiceStatuses.Issued);
    const issuedAt = new Date().toISOString();

    const updated = await this.invoiceRepository.transition({
      invoiceId,
      fromStatus: invoice.status,
      toStatus: InvoiceStatuses.Issued,
      actorUserId: actor.userId,
      reason: body.note ?? null,
      patch: { issuedAt },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "invoice.issued",
      entityType: "invoice",
      entityId: invoiceId,
      requestId,
      previousStatus: invoice.status,
      newStatus: InvoiceStatuses.Issued,
    });

    await this.safeNotify({
      userId: invoice.customerId,
      type: "invoice_issued",
      title: "New invoice",
      body: "You have received a new invoice.",
      entityId: invoiceId,
    });

    return this.toInvoiceDto(updated, actor);
  }

  async view(
    actor: ActorContext,
    invoiceId: string,
    requestId?: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.loadAccessibleInvoice(actor, invoiceId);
    if (invoice.customerId !== actor.userId) {
      throw new InvoiceAccessDeniedError();
    }

    if (invoice.status === InvoiceStatuses.Viewed) {
      return this.toInvoiceDto(invoice, actor);
    }

    if (invoice.status !== InvoiceStatuses.Issued) {
      throw new InvoiceNotEditableError("Only issued invoices can be viewed.");
    }

    assertTransition(InvoiceStatuses.Issued, InvoiceStatuses.Viewed);
    const viewedAt = new Date().toISOString();

    const updated = await this.invoiceRepository.transition({
      invoiceId,
      fromStatus: InvoiceStatuses.Issued,
      toStatus: InvoiceStatuses.Viewed,
      actorUserId: actor.userId,
      reason: "viewed",
      patch: { viewedAt },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "invoice.viewed",
      entityType: "invoice",
      entityId: invoiceId,
      requestId,
      previousStatus: InvoiceStatuses.Issued,
      newStatus: InvoiceStatuses.Viewed,
    });

    return this.toInvoiceDto(updated, actor);
  }

  async approve(
    actor: ActorContext,
    invoiceId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.loadAccessibleInvoice(actor, invoiceId);
    if (invoice.customerId !== actor.userId) {
      throw new InvoiceAccessDeniedError();
    }
    if (!invoice.requiresCustomerApproval) {
      throw new ValidationError("This invoice does not require customer approval.");
    }

    if (
      invoice.status !== InvoiceStatuses.Issued &&
      invoice.status !== InvoiceStatuses.Viewed
    ) {
      throw new InvoiceNotEditableError(
        "Only issued or viewed invoices can be approved.",
      );
    }

    assertTransition(invoice.status, InvoiceStatuses.CustomerApproved);
    const customerApprovedAt = new Date().toISOString();

    const updated = await this.invoiceRepository.transition({
      invoiceId,
      fromStatus: invoice.status,
      toStatus: InvoiceStatuses.CustomerApproved,
      actorUserId: actor.userId,
      reason: body.note ?? null,
      patch: { customerApprovedAt },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "invoice.customer_approved",
      entityType: "invoice",
      entityId: invoiceId,
      requestId,
      previousStatus: invoice.status,
      newStatus: InvoiceStatuses.CustomerApproved,
    });

    await this.notifyBusinessStaff(invoice.businessId, {
      type: "invoice_customer_approved",
      title: "Invoice approved",
      body: "A customer approved an invoice.",
      entityId: invoiceId,
    });

    await this.safeNotify({
      userId: invoice.customerId,
      type: "invoice_customer_approved",
      title: "Invoice approved",
      body: "You approved the invoice.",
      entityId: invoiceId,
    });

    return this.toInvoiceDto(updated, actor);
  }

  async cancel(
    actor: ActorContext,
    businessId: string,
    invoiceId: string,
    body: TransitionRequestDto,
    requestId?: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.loadAccessibleInvoice(actor, invoiceId);
    if (invoice.businessId !== businessId) {
      throw new InvoiceAccessDeniedError();
    }

    if (!CANCELLABLE_STATUSES.includes(invoice.status)) {
      throw new InvoiceNotEditableError(
        "Only draft, issued, or viewed invoices can be cancelled.",
      );
    }

    assertTransition(invoice.status, InvoiceStatuses.Cancelled);
    const cancelledAt = new Date().toISOString();

    const updated = await this.invoiceRepository.transition({
      invoiceId,
      fromStatus: invoice.status,
      toStatus: InvoiceStatuses.Cancelled,
      actorUserId: actor.userId,
      reason: body.note ?? null,
      patch: { cancelledAt },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "invoice.cancelled",
      entityType: "invoice",
      entityId: invoiceId,
      requestId,
      previousStatus: invoice.status,
      newStatus: InvoiceStatuses.Cancelled,
    });

    await this.safeNotify({
      userId: invoice.customerId,
      type: "invoice_cancelled",
      title: "Invoice cancelled",
      body: "Your invoice was cancelled.",
      entityId: invoiceId,
    });

    return this.toInvoiceDto(updated, actor);
  }

  async listPaymentsForActor(
    actor: ActorContext,
    filters: { from?: string; to?: string; invoiceId?: string },
  ): Promise<PaymentResponseDto[]> {
    const payments = await this.invoiceRepository.listPayments({
      customerId: actor.userId,
      from: filters.from,
      to: filters.to,
      invoiceId: filters.invoiceId,
    });

    const result: PaymentResponseDto[] = [];
    for (const payment of payments) {
      const invoice = await this.loadAccessibleInvoice(actor, payment.invoiceId);
      result.push(this.toPaymentDto(payment, actor, invoice));
    }
    return result;
  }

  async listPaymentsForBusiness(
    businessId: string,
    actor: ActorContext,
    filters: {
      from?: string;
      to?: string;
      invoiceId?: string;
      customerId?: string;
    },
  ): Promise<PaymentResponseDto[]> {
    const payments = await this.invoiceRepository.listPayments({
      businessId,
      customerId: filters.customerId,
      from: filters.from,
      to: filters.to,
      invoiceId: filters.invoiceId,
    });

    const result: PaymentResponseDto[] = [];
    for (const payment of payments) {
      const invoice = await this.invoiceRepository.findById(payment.invoiceId);
      if (!invoice) continue;
      result.push(this.toPaymentDto(payment, actor, invoice));
    }
    return result;
  }

  async listPaymentsForInvoice(
    actor: ActorContext,
    invoiceId: string,
  ): Promise<PaymentResponseDto[]> {
    const invoice = await this.loadAccessibleInvoice(actor, invoiceId);
    const payments = await this.invoiceRepository.listPayments({ invoiceId });
    return payments.map((payment) => this.toPaymentDto(payment, actor, invoice));
  }

  async getPayment(
    actor: ActorContext,
    paymentId: string,
  ): Promise<PaymentResponseDto> {
    const { payment, invoice } = await this.loadAccessiblePayment(actor, paymentId);
    return this.toPaymentDto(payment, actor, invoice);
  }

  async recordCashPayment(
    actor: ActorContext,
    businessId: string,
    invoiceId: string,
    body: RecordCashPaymentRequestDto,
    requestId?: string,
    idempotencyKey?: string,
  ): Promise<PaymentResponseDto> {
    await this.assertInvoicesEnabled(businessId);
    await this.assertCashPaymentsEnabled(businessId);

    const invoice = await this.loadAccessibleInvoice(actor, invoiceId);
    if (invoice.businessId !== businessId) {
      throw new InvoiceAccessDeniedError();
    }
    if (invoice.status === InvoiceStatuses.Paid) {
      throw new InvoiceAlreadyPaidError();
    }

    const amount = validateCashPaymentAmount(body.amount, invoice.remainingTotal);

    const result = await this.invoiceRepository.recordCashPayment({
      invoiceId,
      amount,
      confirmedBy: actor.userId,
      requestId,
      idempotencyKey,
    });

    const payment = await this.invoiceRepository.findPaymentById(result.paymentId);
    if (!payment) throw new PaymentNotFoundError(result.paymentId);

    await this.safeNotify({
      userId: invoice.customerId,
      type: "cash_payment_recorded",
      title: "Payment recorded",
      body: `A cash payment of BHD ${amount.toFixed(3)} was recorded.`,
      entityId: invoiceId,
      metadata: { paymentId: payment.id, amount },
    });

    if (result.newStatus === InvoiceStatuses.PartiallyPaid) {
      await this.safeNotify({
        userId: invoice.customerId,
        type: "invoice_partially_paid",
        title: "Partial payment received",
        body: "Your invoice has been partially paid.",
        entityId: invoiceId,
        metadata: {
          paidTotal: result.paidTotal,
          remainingTotal: result.remainingTotal,
        },
      });
    }

    if (result.newStatus === InvoiceStatuses.Paid) {
      await this.safeNotify({
        userId: invoice.customerId,
        type: "invoice_paid",
        title: "Invoice paid",
        body: "Your invoice has been fully paid.",
        entityId: invoiceId,
      });
    }

    return this.toPaymentDto(payment, actor, invoice);
  }
}
