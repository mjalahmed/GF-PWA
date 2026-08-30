import {
  DisputeActorTypes,
  DisputeResolutionActionTypes,
  DisputeStatuses,
  type DisputeActorType,
  type DisputeStatus,
} from "../../core/constants/statuses.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import { permissionsForMembershipRole } from "../../core/auth/business-authorization.middleware.ts";
import type { PaginationMeta } from "../../core/types/context.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { AppointmentRepository } from "../appointments/appointment.repository.interface.ts";
import type { BusinessRepository } from "../business-management/business.repository.interface.ts";
import type { MembershipRepository } from "../business-management/membership.repository.interface.ts";
import type { InvoiceRepository } from "../invoices/invoice.repository.interface.ts";
import type { QuotationRepository } from "../quotations/quotation.repository.interface.ts";
import type { ReviewRepository } from "../reviews/review.repository.interface.ts";
import type {
  AdminDisputeDto,
  BusinessDisputeDto,
  CreateBusinessDisputeRequestDto,
  CreateCustomerDisputeRequestDto,
  CreateDisputeEvidenceResponseDto,
  CustomerDisputeDto,
  DisputeAssignRequestDto,
  DisputeCloseRequestDto,
  DisputeEvidenceRequestDto,
  DisputeInternalMessageRequestDto,
  DisputeMessageRequestDto,
  DisputeRejectRequestDto,
  DisputeResolveRequestDto,
  DisputeTransitionRequestDto,
} from "./dispute.dto.ts";
import {
  DisputeAccessDeniedError,
  DisputeAlreadyExistsError,
  DisputeEvidenceInvalidError,
  DisputeNotFoundError,
  DisputeNotMessageableError,
  DisputeReasonRequiredError,
  DisputeResolutionRequiredError,
} from "./dispute.errors.ts";
import { DisputeMapper, type DisputeAudience } from "./dispute.mapper.ts";
import type { DisputeRepository } from "./dispute.repository.interface.ts";
import {
  assertAtLeastOneDisputeSource,
  assertDisputeSourceGraph,
  assertDisputeTransition,
  assertDisputeWindowOpen,
  assertWithdrawAllowed,
  canSendDisputeMessage,
} from "./dispute.transitions.ts";
import type { DisputeRecord, DisputeSourceRefs } from "./dispute.types.ts";

type ActorContext = {
  userId: string;
  roles?: string[];
  globalPermissions?: string[];
};

const ALLOWED_EVIDENCE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
const MAX_EVIDENCE_BYTES = 10_485_760;

export class DisputeService {
  constructor(
    private readonly disputeRepository: DisputeRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly appointmentRepository: AppointmentRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly reviewRepository: ReviewRepository,
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
        entityType: "dispute",
        entityId: input.entityId,
        metadata: input.metadata ?? {},
      });
    } catch {
      // Notifications must not roll back dispute mutations.
    }
  }

  private async notifyBusinessStaff(
    businessId: string,
    input: {
      type: string;
      title: string;
      body: string;
      entityId: string;
    },
  ): Promise<void> {
    try {
      const members = await this.membershipRepository.listByBusiness(businessId);
      for (const m of members) {
        if (m.status !== "active") continue;
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

  private isAdmin(actor: ActorContext): boolean {
    const roles = actor.roles ?? [];
    return roles.includes("admin") || roles.includes("super_admin");
  }

  private hasGlobalPermission(actor: ActorContext, permission: string): boolean {
    return (actor.globalPermissions ?? []).includes(permission);
  }

  private isDisputeAdmin(actor: ActorContext): boolean {
    return this.isAdmin(actor) ||
      this.hasGlobalPermission(actor, Permissions.Dispute.ReadAll);
  }

  private async hasBusinessDisputePermission(
    businessId: string,
    actor: ActorContext,
    permission: string,
  ): Promise<boolean> {
    if (this.isDisputeAdmin(actor)) return true;
    const membership = await this.businessRepository.findActiveMembership(
      businessId,
      actor.userId,
    );
    if (!membership) return false;
    const perms = permissionsForMembershipRole(membership.role);
    return perms.includes(permission);
  }

  private paginationMeta(
    page: number,
    pageSize: number,
    total: number,
  ): PaginationMeta {
    return {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  private sourceRefs(body: CreateCustomerDisputeRequestDto): DisputeSourceRefs {
    return {
      appointmentId: body.appointmentId ?? null,
      quotationId: body.quotationId ?? null,
      invoiceId: body.invoiceId ?? null,
      paymentId: body.paymentId ?? null,
      reviewId: body.reviewId ?? null,
    };
  }

  private async validateSources(
    customerId: string,
    businessId: string,
    sources: DisputeSourceRefs,
  ): Promise<void> {
    assertAtLeastOneDisputeSource(sources);

    const appointment = sources.appointmentId
      ? await this.appointmentRepository.findById(sources.appointmentId)
      : null;
    const quotation = sources.quotationId
      ? await this.quotationRepository.findById(sources.quotationId)
      : null;
    const invoice = sources.invoiceId
      ? await this.invoiceRepository.findById(sources.invoiceId)
      : null;
    const payment = sources.paymentId
      ? await this.invoiceRepository.findPaymentById(sources.paymentId)
      : null;
    const review = sources.reviewId
      ? await this.reviewRepository.findReviewById(sources.reviewId)
      : null;

    assertDisputeSourceGraph({
      customerId,
      businessId,
      sources,
      appointment: appointment
        ? {
          customerId: appointment.customerId,
          businessId: appointment.businessId,
        }
        : null,
      quotation: quotation
        ? {
          customerId: quotation.customerId,
          businessId: quotation.businessId,
        }
        : null,
      invoice: invoice
        ? {
          customerId: invoice.customerId,
          businessId: invoice.businessId,
        }
        : null,
      payment: payment
        ? {
          customerId: payment.customerId,
          businessId: payment.businessId,
          invoiceId: payment.invoiceId,
        }
        : null,
      review: review
        ? {
          customerId: review.customerId,
          businessId: review.businessId,
        }
        : null,
    });

    const windowEvents = {
      invoicePaidAt: invoice?.paidAt ?? null,
      appointmentCompletedAt: appointment?.completedAt ?? null,
      reviewCreatedAt: review?.createdAt ?? null,
      quotationAcceptedAt: quotation?.acceptedAt ?? null,
      paymentConfirmedAt: payment?.confirmedAt ?? null,
      fallbackCreatedAt: new Date().toISOString(),
    };
    assertDisputeWindowOpen(windowEvents);
  }

  private async resolveAudience(
    record: DisputeRecord,
    actor: ActorContext,
  ): Promise<DisputeAudience> {
    if (this.isDisputeAdmin(actor)) return "admin";
    if (record.customerId === actor.userId) return "customer";
    if (
      await this.hasBusinessDisputePermission(
        record.businessId,
        actor,
        Permissions.BusinessDispute.Read,
      )
    ) {
      return "business";
    }
    throw new DisputeAccessDeniedError();
  }

  private async toAudienceDto(
    record: DisputeRecord,
    audience: DisputeAudience,
    includeDetail = false,
  ) {
    const sourceContext = includeDetail
      ? await this.disputeRepository.loadSourceContext(record)
      : undefined;
    return DisputeMapper.toAudienceDto(record, audience, sourceContext);
  }

  private async loadAccessibleDispute(
    actor: ActorContext,
    disputeId: string,
    options?: {
      includeMessages?: boolean;
      includeEvidence?: boolean;
      includeHistory?: boolean;
      includeActions?: boolean;
    },
  ): Promise<{ record: DisputeRecord; audience: DisputeAudience }> {
    const record = await this.disputeRepository.findById(disputeId, {
      ...options,
      signedEvidenceUrls: true,
    });
    if (!record) throw new DisputeNotFoundError(disputeId);
    const audience = await this.resolveAudience(record, actor);
    return { record, audience };
  }

  private async audit(
    actorUserId: string,
    action: string,
    disputeId: string,
    requestId?: string,
    extra?: {
      previousStatus?: DisputeStatus;
      newStatus?: DisputeStatus;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
    await this.auditRepository.write({
      actorUserId,
      action,
      entityType: "dispute",
      entityId: disputeId,
      requestId,
      previousStatus: extra?.previousStatus,
      newStatus: extra?.newStatus,
      metadata: extra?.metadata,
    });
  }

  private async transitionDispute(input: {
    actor: ActorContext;
    disputeId: string;
    newStatus: DisputeStatus;
    reason?: string | null;
    actionType: string;
    metadata?: Record<string, unknown>;
    resolutionCode?: DisputeResolveRequestDto["resolutionCode"] | null;
    resolutionSummary?: string | null;
    requestId?: string;
  }): Promise<DisputeRecord> {
    const { record, audience: _audience } = await this.loadAccessibleDispute(
      input.actor,
      input.disputeId,
    );
    assertDisputeTransition(record.status, input.newStatus);

    const now = new Date().toISOString();
    const updated = await this.disputeRepository.updateStatus({
      disputeId: record.id,
      previousStatus: record.status,
      newStatus: input.newStatus,
      changedBy: input.actor.userId,
      reason: input.reason ?? null,
      metadata: input.metadata ?? {},
      resolutionCode: input.resolutionCode ?? undefined,
      resolutionSummary: input.resolutionSummary ?? undefined,
      resolvedAt: input.newStatus === DisputeStatuses.Resolved ? now : undefined,
      closedAt: input.newStatus === DisputeStatuses.Closed ? now : undefined,
    });

    await this.disputeRepository.recordAction({
      disputeId: record.id,
      actionType: input.actionType as never,
      performedBy: input.actor.userId,
      resolutionCode: input.resolutionCode ?? null,
      description: input.reason ?? null,
      metadata: input.metadata ?? {},
    });

    const auditActionByType: Record<string, string> = {
      [DisputeResolutionActionTypes.RequestedCustomerResponse]:
        "dispute.customer_response_requested",
      [DisputeResolutionActionTypes.RequestedBusinessResponse]:
        "dispute.business_response_requested",
      [DisputeResolutionActionTypes.MarkedUnderReview]: "dispute.review_started",
      [DisputeResolutionActionTypes.Resolved]: "dispute.resolved",
      [DisputeResolutionActionTypes.Rejected]: "dispute.rejected",
      [DisputeResolutionActionTypes.Closed]: "dispute.closed",
      [DisputeResolutionActionTypes.Withdrawn]: "dispute.withdrawn",
      [DisputeResolutionActionTypes.Assigned]: "dispute.assigned",
      [DisputeResolutionActionTypes.InternalNote]: "dispute.internal_note_added",
    };
    await this.audit(
      input.actor.userId,
      auditActionByType[input.actionType] ?? `dispute.${input.actionType}`,
      record.id,
      input.requestId,
      {
        previousStatus: record.status,
        newStatus: input.newStatus,
        metadata: input.metadata,
      },
    );

    if (input.newStatus === DisputeStatuses.AwaitingBusiness) {
      await this.notifyBusinessStaff(record.businessId, {
        type: "dispute_business_response_required",
        title: "Dispute requires your response",
        body: record.summary,
        entityId: record.id,
      });
    }
    if (input.newStatus === DisputeStatuses.AwaitingCustomer) {
      await this.safeNotify({
        userId: record.customerId,
        type: "dispute_customer_response_required",
        title: "Dispute requires your response",
        body: record.summary,
        entityId: record.id,
      });
    }
    if (input.newStatus === DisputeStatuses.UnderReview) {
      await this.safeNotify({
        userId: record.customerId,
        type: "dispute_under_review",
        title: "Dispute under review",
        body: `Your dispute ${record.disputeNumber} is now under review.`,
        entityId: record.id,
      });
      await this.notifyBusinessStaff(record.businessId, {
        type: "dispute_under_review",
        title: "Dispute under review",
        body: `Dispute ${record.disputeNumber} is under review.`,
        entityId: record.id,
      });
    }
    if (
      input.newStatus === DisputeStatuses.Resolved ||
      input.newStatus === DisputeStatuses.Rejected ||
      input.newStatus === DisputeStatuses.Closed
    ) {
      await this.safeNotify({
        userId: record.customerId,
        type: `dispute_${input.newStatus}`,
        title: "Dispute updated",
        body: record.summary,
        entityId: record.id,
      });
      await this.notifyBusinessStaff(record.businessId, {
        type: `dispute_${input.newStatus}`,
        title: "Dispute updated",
        body: record.summary,
        entityId: record.id,
      });
    }

    return updated;
  }

  async createCustomerDispute(
    actor: ActorContext,
    body: CreateCustomerDisputeRequestDto,
    requestId?: string,
  ): Promise<CustomerDisputeDto> {
    const sources = this.sourceRefs(body);
    await this.validateSources(actor.userId, body.businessId, sources);

    const existing = await this.disputeRepository.findActiveBySource(sources);
    if (existing) throw new DisputeAlreadyExistsError(existing.id);

    let record: DisputeRecord;
    try {
      record = await this.disputeRepository.create({
        openedBy: actor.userId,
        openedByType: DisputeActorTypes.Customer,
        customerId: actor.userId,
        businessId: body.businessId,
        ...sources,
        reasonCode: body.reasonCode,
        summary: body.summary,
        description: body.description ?? null,
        status: DisputeStatuses.AwaitingBusiness,
        initialMessage: body.initialMessage ?? null,
      });
    } catch (error) {
      if (error instanceof DisputeAlreadyExistsError) throw error;
      throw error;
    }

    await this.audit(actor.userId, "dispute.created", record.id, requestId, {
      newStatus: record.status,
    });

    await this.notifyBusinessStaff(body.businessId, {
      type: "dispute_opened",
      title: "New customer dispute",
      body: body.summary,
      entityId: record.id,
    });

    const hydrated = await this.disputeRepository.findById(record.id, {
      includeMessages: true,
      includeEvidence: true,
      signedEvidenceUrls: true,
    });
    return this.toAudienceDto(hydrated ?? record, "customer", true) as CustomerDisputeDto;
  }

  async createBusinessDispute(
    actor: ActorContext,
    businessId: string,
    body: CreateBusinessDisputeRequestDto,
    requestId?: string,
  ): Promise<BusinessDisputeDto> {
    if (
      !(await this.hasBusinessDisputePermission(
        businessId,
        actor,
        Permissions.BusinessDispute.Create,
      ))
    ) {
      throw new DisputeAccessDeniedError();
    }

    const sources = this.sourceRefs(body);
    await this.validateSources(body.customerId, businessId, sources);

    const existing = await this.disputeRepository.findActiveBySource(sources);
    if (existing) throw new DisputeAlreadyExistsError(existing.id);

    const record = await this.disputeRepository.create({
      openedBy: actor.userId,
      openedByType: DisputeActorTypes.Business,
      customerId: body.customerId,
      businessId,
      ...sources,
      reasonCode: body.reasonCode,
      summary: body.summary,
      description: body.description ?? null,
      status: DisputeStatuses.AwaitingCustomer,
      initialMessage: body.initialMessage ?? null,
    });

    await this.audit(actor.userId, "dispute.created", record.id, requestId, {
      newStatus: record.status,
    });

    await this.safeNotify({
      userId: body.customerId,
      type: "dispute_opened",
      title: "New dispute opened",
      body: body.summary,
      entityId: record.id,
    });

    const hydrated = await this.disputeRepository.findById(record.id, {
      includeMessages: true,
      includeEvidence: true,
      signedEvidenceUrls: true,
    });
    return this.toAudienceDto(hydrated ?? record, "business", true) as BusinessDisputeDto;
  }

  async listCustomerDisputes(
    actor: ActorContext,
    filters: {
      status?: DisputeStatus | DisputeStatus[];
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: CustomerDisputeDto[]; pagination: PaginationMeta }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const result = await this.disputeRepository.list({
      customerId: actor.userId,
      status: filters.status,
      page,
      pageSize,
    });

    return {
      items: result.items.map((r) =>
        DisputeMapper.toCustomerDto(r)
      ) as CustomerDisputeDto[],
      pagination: this.paginationMeta(page, pageSize, result.total),
    };
  }

  async listBusinessDisputes(
    actor: ActorContext,
    businessId: string,
    filters: {
      status?: DisputeStatus | DisputeStatus[];
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: BusinessDisputeDto[]; pagination: PaginationMeta }> {
    if (
      !(await this.hasBusinessDisputePermission(
        businessId,
        actor,
        Permissions.BusinessDispute.Read,
      ))
    ) {
      throw new DisputeAccessDeniedError();
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const result = await this.disputeRepository.list({
      businessId,
      status: filters.status,
      page,
      pageSize,
    });

    return {
      items: result.items.map((r) => DisputeMapper.toBusinessDto(r)),
      pagination: this.paginationMeta(page, pageSize, result.total),
    };
  }

  async listAdminDisputes(
    actor: ActorContext,
    filters: {
      customerId?: string;
      businessId?: string;
      assignedAdminId?: string;
      status?: DisputeStatus | DisputeStatus[];
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: AdminDisputeDto[]; pagination: PaginationMeta }> {
    if (!this.isDisputeAdmin(actor)) throw new DisputeAccessDeniedError();

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const result = await this.disputeRepository.list({
      customerId: filters.customerId,
      businessId: filters.businessId,
      assignedAdminId: filters.assignedAdminId,
      status: filters.status,
      page,
      pageSize,
    });

    return {
      items: result.items.map((r) => DisputeMapper.toAdminDto(r)),
      pagination: this.paginationMeta(page, pageSize, result.total),
    };
  }

  async getDispute(
    actor: ActorContext,
    disputeId: string,
  ): Promise<CustomerDisputeDto | BusinessDisputeDto | AdminDisputeDto> {
    const preliminary = await this.disputeRepository.findById(disputeId);
    if (!preliminary) throw new DisputeNotFoundError(disputeId);
    const audience = await this.resolveAudience(preliminary, actor);

    const record = await this.disputeRepository.findById(disputeId, {
      includeMessages: true,
      includeEvidence: true,
      includeHistory: audience === "admin",
      includeActions: audience === "admin",
      signedEvidenceUrls: true,
    });
    if (!record) throw new DisputeNotFoundError(disputeId);
    return this.toAudienceDto(record, audience, true);
  }

  async addCustomerMessage(
    actor: ActorContext,
    disputeId: string,
    body: DisputeMessageRequestDto,
  ): Promise<CustomerDisputeDto> {
    const { record } = await this.loadAccessibleDispute(actor, disputeId);
    if (record.customerId !== actor.userId) throw new DisputeAccessDeniedError();
    if (!canSendDisputeMessage(record.status)) throw new DisputeNotMessageableError();

    const updated = await this.disputeRepository.addMessage({
      disputeId,
      senderUserId: actor.userId,
      senderType: DisputeActorTypes.Customer,
      message: body.message,
    });

    await this.audit(actor.userId, "dispute.message_added", disputeId);
    await this.notifyBusinessStaff(record.businessId, {
      type: "dispute_message_received",
      title: "New dispute message",
      body: body.message.slice(0, 120),
      entityId: disputeId,
    });

    return this.toAudienceDto(updated, "customer", true) as CustomerDisputeDto;
  }

  async addBusinessMessage(
    actor: ActorContext,
    businessId: string,
    disputeId: string,
    body: DisputeMessageRequestDto,
  ): Promise<BusinessDisputeDto> {
    if (
      !(await this.hasBusinessDisputePermission(
        businessId,
        actor,
        Permissions.BusinessDispute.Respond,
      ))
    ) {
      throw new DisputeAccessDeniedError();
    }

    const record = await this.disputeRepository.findById(disputeId);
    if (!record || record.businessId !== businessId) {
      throw new DisputeNotFoundError(disputeId);
    }
    if (!canSendDisputeMessage(record.status)) throw new DisputeNotMessageableError();

    const updated = await this.disputeRepository.addMessage({
      disputeId,
      senderUserId: actor.userId,
      senderType: DisputeActorTypes.Business,
      message: body.message,
    });

    await this.audit(actor.userId, "dispute.message_added", disputeId);
    await this.safeNotify({
      userId: record.customerId,
      type: "dispute_message_received",
      title: "New dispute message",
      body: body.message.slice(0, 120),
      entityId: disputeId,
    });

    return this.toAudienceDto(updated, "business", true) as BusinessDisputeDto;
  }

  async addInternalMessage(
    actor: ActorContext,
    disputeId: string,
    body: DisputeInternalMessageRequestDto,
  ): Promise<AdminDisputeDto> {
    if (
      !this.isDisputeAdmin(actor) &&
      !this.hasGlobalPermission(actor, Permissions.Dispute.InternalNote)
    ) {
      throw new DisputeAccessDeniedError();
    }

    const record = await this.disputeRepository.findById(disputeId);
    if (!record) throw new DisputeNotFoundError(disputeId);
    if (!canSendDisputeMessage(record.status)) throw new DisputeNotMessageableError();

    await this.disputeRepository.addMessage({
      disputeId,
      senderUserId: actor.userId,
      senderType: DisputeActorTypes.Admin,
      message: body.message,
      isInternal: true,
    });
    await this.disputeRepository.appendInternalNotes(disputeId, body.message);
    await this.disputeRepository.recordAction({
      disputeId,
      actionType: DisputeResolutionActionTypes.InternalNote,
      performedBy: actor.userId,
      description: body.message,
    });
    await this.audit(actor.userId, "dispute.internal_note_added", disputeId);

    const updated = await this.loadAccessibleDispute(actor, disputeId, {
      includeMessages: true,
      includeEvidence: true,
      includeHistory: true,
      includeActions: true,
    });
    return this.toAudienceDto(updated.record, "admin", true) as AdminDisputeDto;
  }

  private validateEvidenceInput(body: DisputeEvidenceRequestDto): void {
    if (!ALLOWED_EVIDENCE_MIME.has(body.mimeType)) {
      throw new DisputeEvidenceInvalidError("Unsupported evidence MIME type.");
    }
    if (body.fileSizeBytes > MAX_EVIDENCE_BYTES) {
      throw new DisputeEvidenceInvalidError("Evidence file exceeds 10MB limit.");
    }
  }

  async addCustomerEvidence(
    actor: ActorContext,
    disputeId: string,
    body: DisputeEvidenceRequestDto,
  ): Promise<CreateDisputeEvidenceResponseDto> {
    const { record } = await this.loadAccessibleDispute(actor, disputeId);
    if (record.customerId !== actor.userId) throw new DisputeAccessDeniedError();
    if (!canSendDisputeMessage(record.status)) throw new DisputeNotMessageableError();
    this.validateEvidenceInput(body);

    const created = await this.disputeRepository.createEvidenceMetadata({
      disputeId,
      uploadedBy: actor.userId,
      uploaderType: DisputeActorTypes.Customer,
      originalFileName: body.originalFileName,
      mimeType: body.mimeType,
      fileSizeBytes: body.fileSizeBytes,
      description: body.description ?? null,
    });

    await this.audit(actor.userId, "dispute.evidence_added", disputeId);

    const evidenceRecord = (await this.disputeRepository.findById(disputeId, {
      includeEvidence: true,
      signedEvidenceUrls: true,
    }))?.evidence?.find((e) => e.id === created.evidenceId);

    return {
      evidence: DisputeMapper.toEvidenceDto(
        evidenceRecord ?? {
          id: created.evidenceId,
          disputeId,
          uploadedBy: actor.userId,
          uploaderType: DisputeActorTypes.Customer,
          storagePath: created.storagePath,
          originalFileName: body.originalFileName,
          mimeType: body.mimeType,
          fileSizeBytes: body.fileSizeBytes,
          description: body.description ?? null,
          createdAt: new Date().toISOString(),
        },
      ),
      uploadUrl: created.uploadUrl,
    };
  }

  async addBusinessEvidence(
    actor: ActorContext,
    businessId: string,
    disputeId: string,
    body: DisputeEvidenceRequestDto,
  ): Promise<CreateDisputeEvidenceResponseDto> {
    if (
      !(await this.hasBusinessDisputePermission(
        businessId,
        actor,
        Permissions.BusinessDispute.Evidence,
      ))
    ) {
      throw new DisputeAccessDeniedError();
    }

    const record = await this.disputeRepository.findById(disputeId);
    if (!record || record.businessId !== businessId) {
      throw new DisputeNotFoundError(disputeId);
    }
    if (!canSendDisputeMessage(record.status)) throw new DisputeNotMessageableError();
    this.validateEvidenceInput(body);

    const created = await this.disputeRepository.createEvidenceMetadata({
      disputeId,
      uploadedBy: actor.userId,
      uploaderType: DisputeActorTypes.Business,
      originalFileName: body.originalFileName,
      mimeType: body.mimeType,
      fileSizeBytes: body.fileSizeBytes,
      description: body.description ?? null,
    });

    await this.audit(actor.userId, "dispute.evidence_added", disputeId);

    return {
      evidence: DisputeMapper.toEvidenceDto({
        id: created.evidenceId,
        disputeId,
        uploadedBy: actor.userId,
        uploaderType: DisputeActorTypes.Business,
        storagePath: created.storagePath,
        originalFileName: body.originalFileName,
        mimeType: body.mimeType,
        fileSizeBytes: body.fileSizeBytes,
        description: body.description ?? null,
        createdAt: new Date().toISOString(),
      }),
      uploadUrl: created.uploadUrl,
    };
  }

  async withdrawDispute(
    actor: ActorContext,
    disputeId: string,
    requestId?: string,
  ): Promise<CustomerDisputeDto> {
    const { record } = await this.loadAccessibleDispute(actor, disputeId);
    assertWithdrawAllowed({
      status: record.status,
      customerId: record.customerId,
      actorUserId: actor.userId,
      openedByType: record.openedByType,
    });

    const updated = await this.transitionDispute({
      actor,
      disputeId,
      newStatus: DisputeStatuses.Withdrawn,
      reason: "Withdrawn by customer",
      actionType: DisputeResolutionActionTypes.Withdrawn,
      requestId,
    });

    return this.toAudienceDto(updated, "customer", true) as CustomerDisputeDto;
  }

  async assignDispute(
    actor: ActorContext,
    disputeId: string,
    body: DisputeAssignRequestDto,
    requestId?: string,
  ): Promise<AdminDisputeDto> {
    if (
      !this.isDisputeAdmin(actor) &&
      !this.hasGlobalPermission(actor, Permissions.Dispute.Assign)
    ) {
      throw new DisputeAccessDeniedError();
    }

    const record = await this.disputeRepository.findById(disputeId);
    if (!record) throw new DisputeNotFoundError(disputeId);

    await this.disputeRepository.assignAdmin(
      disputeId,
      body.assignedAdminId,
      actor.userId,
    );
    await this.audit(actor.userId, "dispute.assigned", disputeId, requestId, {
      metadata: { assignedAdminId: body.assignedAdminId },
    });
    await this.safeNotify({
      userId: body.assignedAdminId,
      type: "dispute_assigned",
      title: "Dispute assigned",
      body: `Dispute ${record.disputeNumber} was assigned to you.`,
      entityId: disputeId,
    });

    const hydrated = await this.loadAccessibleDispute(actor, disputeId, {
      includeMessages: true,
      includeEvidence: true,
      includeHistory: true,
      includeActions: true,
    });
    return this.toAudienceDto(hydrated.record, "admin", true) as AdminDisputeDto;
  }

  async requestCustomerResponse(
    actor: ActorContext,
    disputeId: string,
    body: DisputeTransitionRequestDto,
    requestId?: string,
  ): Promise<AdminDisputeDto> {
    this.assertAdminAction(actor, Permissions.Dispute.RequestResponse);
    const updated = await this.transitionDispute({
      actor,
      disputeId,
      newStatus: DisputeStatuses.AwaitingCustomer,
      reason: body.reason ?? null,
      actionType: DisputeResolutionActionTypes.RequestedCustomerResponse,
      requestId,
    });
    return this.toAudienceDto(updated, "admin", true) as AdminDisputeDto;
  }

  async requestBusinessResponse(
    actor: ActorContext,
    disputeId: string,
    body: DisputeTransitionRequestDto,
    requestId?: string,
  ): Promise<AdminDisputeDto> {
    this.assertAdminAction(actor, Permissions.Dispute.RequestResponse);
    const updated = await this.transitionDispute({
      actor,
      disputeId,
      newStatus: DisputeStatuses.AwaitingBusiness,
      reason: body.reason ?? null,
      actionType: DisputeResolutionActionTypes.RequestedBusinessResponse,
      requestId,
    });
    return this.toAudienceDto(updated, "admin", true) as AdminDisputeDto;
  }

  async startReview(
    actor: ActorContext,
    disputeId: string,
    body: DisputeTransitionRequestDto,
    requestId?: string,
  ): Promise<AdminDisputeDto> {
    this.assertAdminAction(actor, Permissions.Dispute.Review);
    const updated = await this.transitionDispute({
      actor,
      disputeId,
      newStatus: DisputeStatuses.UnderReview,
      reason: body.reason ?? null,
      actionType: DisputeResolutionActionTypes.MarkedUnderReview,
      requestId,
    });
    return this.toAudienceDto(updated, "admin", true) as AdminDisputeDto;
  }

  async resolveDispute(
    actor: ActorContext,
    disputeId: string,
    body: DisputeResolveRequestDto,
    requestId?: string,
  ): Promise<AdminDisputeDto> {
    this.assertAdminAction(actor, Permissions.Dispute.Resolve);
    if (!body.resolutionCode || !body.resolutionSummary?.trim()) {
      throw new DisputeResolutionRequiredError();
    }

    const updated = await this.transitionDispute({
      actor,
      disputeId,
      newStatus: DisputeStatuses.Resolved,
      reason: body.reason ?? null,
      actionType: DisputeResolutionActionTypes.Resolved,
      resolutionCode: body.resolutionCode,
      resolutionSummary: body.resolutionSummary,
      requestId,
    });
    return this.toAudienceDto(updated, "admin", true) as AdminDisputeDto;
  }

  async rejectDispute(
    actor: ActorContext,
    disputeId: string,
    body: DisputeRejectRequestDto,
    requestId?: string,
  ): Promise<AdminDisputeDto> {
    this.assertAdminAction(actor, Permissions.Dispute.Reject);
    if (!body.reason?.trim()) throw new DisputeReasonRequiredError();

    const updated = await this.transitionDispute({
      actor,
      disputeId,
      newStatus: DisputeStatuses.Rejected,
      reason: body.reason,
      actionType: DisputeResolutionActionTypes.Rejected,
      requestId,
    });
    return this.toAudienceDto(updated, "admin", true) as AdminDisputeDto;
  }

  async closeDispute(
    actor: ActorContext,
    disputeId: string,
    body: DisputeCloseRequestDto,
    requestId?: string,
  ): Promise<AdminDisputeDto> {
    this.assertAdminAction(actor, Permissions.Dispute.Close);
    const updated = await this.transitionDispute({
      actor,
      disputeId,
      newStatus: DisputeStatuses.Closed,
      reason: body.reason ?? null,
      actionType: DisputeResolutionActionTypes.Closed,
      requestId,
    });
    return this.toAudienceDto(updated, "admin", true) as AdminDisputeDto;
  }

  private assertAdminAction(actor: ActorContext, permission: string): void {
    if (!this.isDisputeAdmin(actor) && !this.hasGlobalPermission(actor, permission)) {
      throw new DisputeAccessDeniedError();
    }
  }
}
