import { Permissions } from "../../core/constants/permissions.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import { BusinessApplicationStatuses } from "../../core/constants/statuses.ts";
import { ConflictError } from "../../core/errors/app-error.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BusinessApplicationRepository } from "./business-application.repository.interface.ts";
import type { BusinessDocumentRepository } from "./business-document.repository.interface.ts";
import type { BusinessReviewRepository } from "./business-review.repository.interface.ts";
import {
  ApplicationAccessDeniedError,
  ApplicationNotFoundError,
  CategoryNotFoundError,
  assertApplicationEditable,
  assertApplicationStatusTransition,
} from "./business-application.errors.ts";
import { BusinessApplicationMapper } from "./business-application.mapper.ts";
import type {
  ApproveApplicationResponseDto,
  BusinessApplicationBranchResponseDto,
  BusinessApplicationDetailResponseDto,
  BusinessApplicationResponseDto,
  BusinessCategoryResponseDto,
  BusinessDocumentRequirementResponseDto,
  CreateApplicationRequestDto,
  ListApplicationsQueryDto,
  RejectApplicationRequestDto,
  RequestChangesRequestDto,
  UpdateApplicationRequestDto,
  UpdateBranchRequestDto,
} from "./business-application.dto.ts";
import type { BusinessApplicationRecord } from "./business-application.types.ts";

export class BusinessApplicationService {
  constructor(
    private readonly applicationRepository: BusinessApplicationRepository,
    private readonly documentRepository: BusinessDocumentRepository,
    private readonly reviewRepository: BusinessReviewRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  private now(): string {
    return new Date().toISOString();
  }

  private canReadAll(permissions: string[]): boolean {
    return permissions.includes(Permissions.BusinessApplication.ReadAll);
  }

  private async loadApplicationOrThrow(
    id: string,
  ): Promise<BusinessApplicationRecord> {
    const application = await this.applicationRepository.findById(id);
    if (!application) throw new ApplicationNotFoundError(id);
    return application;
  }

  private assertOwnerOrReadAll(
    application: BusinessApplicationRecord,
    userId: string,
    permissions: string[],
  ): void {
    if (application.applicantUserId === userId) return;
    if (this.canReadAll(permissions)) return;
    throw new ApplicationAccessDeniedError();
  }

  private assertOwner(
    application: BusinessApplicationRecord,
    userId: string,
  ): void {
    if (application.applicantUserId !== userId) {
      throw new ApplicationAccessDeniedError();
    }
  }

  async createDraft(
    userId: string,
    input: CreateApplicationRequestDto,
  ): Promise<BusinessApplicationResponseDto> {
    const category = await this.applicationRepository.findCategoryById(
      input.businessCategoryId,
    );
    if (!category) throw new CategoryNotFoundError(input.businessCategoryId);

    const created = await this.applicationRepository.create({
      applicantUserId: userId,
      businessCategoryId: input.businessCategoryId,
      legalName: input.legalName,
      displayName: input.displayName,
      description: input.description,
      commercialRegistrationNumber: input.commercialRegistrationNumber,
      phone: input.phone,
      email: input.email,
      website: input.website,
    });

    await this.auditRepository.write({
      actorUserId: userId,
      action: "business.application.created",
      entityType: "business_application",
      entityId: created.id,
      newStatus: created.status,
    });

    return BusinessApplicationMapper.toApplicationDto(created);
  }

  async listMine(userId: string): Promise<BusinessApplicationResponseDto[]> {
    const items = await this.applicationRepository.findByApplicant(userId);
    return items.map(BusinessApplicationMapper.toApplicationDto);
  }

  async listAll(
    filters: ListApplicationsQueryDto,
  ): Promise<{
    items: BusinessApplicationResponseDto[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const result = await this.applicationRepository.findAll({
      status: filters.status,
      assignedReviewerId: filters.assignedReviewerId,
      page,
      pageSize,
    });

    return {
      items: result.items.map(BusinessApplicationMapper.toApplicationDto),
      total: result.total,
      page,
      pageSize,
    };
  }

  async getById(
    userId: string,
    id: string,
    permissions: string[],
  ): Promise<BusinessApplicationDetailResponseDto> {
    const application = await this.loadApplicationOrThrow(id);
    this.assertOwnerOrReadAll(application, userId, permissions);

    const [branch, steps, documents, requirements, reviews] = await Promise.all([
      this.applicationRepository.findBranch(id),
      this.applicationRepository.findSteps(id),
      this.documentRepository.listByApplication(id),
      this.applicationRepository.listRequirements(application.businessCategoryId),
      this.reviewRepository.listByApplication(id),
    ]);

    return BusinessApplicationMapper.toDetailDto({
      application,
      branch,
      steps,
      documents,
      requirements,
      reviews,
    });
  }

  async updateDraft(
    userId: string,
    id: string,
    input: UpdateApplicationRequestDto,
  ): Promise<BusinessApplicationResponseDto> {
    const application = await this.loadApplicationOrThrow(id);
    this.assertOwner(application, userId);
    assertApplicationEditable(application.status);

    if (input.businessCategoryId) {
      const category = await this.applicationRepository.findCategoryById(
        input.businessCategoryId,
      );
      if (!category) throw new CategoryNotFoundError(input.businessCategoryId);
    }

    const updated = await this.applicationRepository.updateFields(id, {
      businessCategoryId: input.businessCategoryId,
      legalName: input.legalName,
      displayName: input.displayName,
      description: input.description,
      commercialRegistrationNumber: input.commercialRegistrationNumber,
      phone: input.phone,
      email: input.email,
      website: input.website,
      currentStep: input.currentStep,
    });

    return BusinessApplicationMapper.toApplicationDto(updated);
  }

  async updateBranch(
    userId: string,
    id: string,
    input: UpdateBranchRequestDto,
  ): Promise<BusinessApplicationBranchResponseDto> {
    const application = await this.loadApplicationOrThrow(id);
    this.assertOwner(application, userId);
    assertApplicationEditable(application.status);

    const branch = await this.applicationRepository.upsertBranch(id, {
      name: input.name,
      phone: input.phone,
      email: input.email,
      addressLine: input.addressLine,
      area: input.area,
      city: input.city,
      countryCode: input.countryCode,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone,
    });

    return BusinessApplicationMapper.toBranchDto(branch);
  }

  async submit(
    userId: string,
    id: string,
    requestId?: string,
  ): Promise<BusinessApplicationResponseDto> {
    const application = await this.loadApplicationOrThrow(id);
    this.assertOwner(application, userId);
    assertApplicationStatusTransition(
      application.status,
      BusinessApplicationStatuses.Submitted,
    );

    const updated = await this.applicationRepository.updateStatusAdmin(id, {
      status: BusinessApplicationStatuses.Submitted,
      submittedAt: this.now(),
    });

    await this.reviewRepository.create({
      applicationId: id,
      reviewerUserId: userId,
      action: "submitted",
      previousStatus: application.status,
      newStatus: BusinessApplicationStatuses.Submitted,
    });

    await this.auditRepository.write({
      actorUserId: userId,
      action: "business.application.submitted",
      entityType: "business_application",
      entityId: id,
      requestId,
      previousStatus: application.status,
      newStatus: updated.status,
    });

    return BusinessApplicationMapper.toApplicationDto(updated);
  }

  async withdraw(
    userId: string,
    id: string,
    requestId?: string,
  ): Promise<BusinessApplicationResponseDto> {
    const application = await this.loadApplicationOrThrow(id);
    this.assertOwner(application, userId);
    assertApplicationStatusTransition(
      application.status,
      BusinessApplicationStatuses.Withdrawn,
    );

    const updated = await this.applicationRepository.updateStatusAdmin(id, {
      status: BusinessApplicationStatuses.Withdrawn,
      withdrawnAt: this.now(),
    });

    await this.reviewRepository.create({
      applicationId: id,
      reviewerUserId: userId,
      action: "withdrawn",
      previousStatus: application.status,
      newStatus: BusinessApplicationStatuses.Withdrawn,
    });

    await this.auditRepository.write({
      actorUserId: userId,
      action: "business.application.withdrawn",
      entityType: "business_application",
      entityId: id,
      requestId,
      previousStatus: application.status,
      newStatus: updated.status,
    });

    return BusinessApplicationMapper.toApplicationDto(updated);
  }

  async assignReviewer(
    actorId: string,
    id: string,
    reviewerId: string,
    requestId?: string,
  ): Promise<BusinessApplicationResponseDto> {
    const application = await this.loadApplicationOrThrow(id);

    const updated = await this.applicationRepository.updateStatusAdmin(id, {
      status: application.status,
      assignedReviewerId: reviewerId,
    });

    await this.reviewRepository.create({
      applicationId: id,
      reviewerUserId: actorId,
      action: "reviewer_assigned",
      previousStatus: application.status,
      newStatus: application.status,
      metadata: { assignedReviewerId: reviewerId },
    });

    await this.auditRepository.write({
      actorUserId: actorId,
      action: "business.application.reviewer_assigned",
      entityType: "business_application",
      entityId: id,
      requestId,
      metadata: { assignedReviewerId: reviewerId },
    });

    return BusinessApplicationMapper.toApplicationDto(updated);
  }

  async startReview(
    actorId: string,
    id: string,
    requestId?: string,
  ): Promise<BusinessApplicationResponseDto> {
    const application = await this.loadApplicationOrThrow(id);
    assertApplicationStatusTransition(
      application.status,
      BusinessApplicationStatuses.UnderReview,
    );

    const updated = await this.applicationRepository.updateStatusAdmin(id, {
      status: BusinessApplicationStatuses.UnderReview,
      reviewStartedAt: this.now(),
    });

    await this.reviewRepository.create({
      applicationId: id,
      reviewerUserId: actorId,
      action: "review_started",
      previousStatus: application.status,
      newStatus: BusinessApplicationStatuses.UnderReview,
    });

    await this.auditRepository.write({
      actorUserId: actorId,
      action: "business.application.review_started",
      entityType: "business_application",
      entityId: id,
      requestId,
      previousStatus: application.status,
      newStatus: updated.status,
    });

    return BusinessApplicationMapper.toApplicationDto(updated);
  }

  async requestChanges(
    actorId: string,
    id: string,
    input: RequestChangesRequestDto,
    requestId?: string,
  ): Promise<BusinessApplicationResponseDto> {
    const application = await this.loadApplicationOrThrow(id);
    assertApplicationStatusTransition(
      application.status,
      BusinessApplicationStatuses.ChangesRequested,
    );

    const updated = await this.applicationRepository.updateStatusAdmin(id, {
      status: BusinessApplicationStatuses.ChangesRequested,
      changesRequestedAt: this.now(),
      changesRequestedReason: input.reason,
    });

    await this.reviewRepository.create({
      applicationId: id,
      reviewerUserId: actorId,
      action: "changes_requested",
      previousStatus: application.status,
      newStatus: BusinessApplicationStatuses.ChangesRequested,
      reason: input.reason,
    });

    await this.auditRepository.write({
      actorUserId: actorId,
      action: "business.application.changes_requested",
      entityType: "business_application",
      entityId: id,
      requestId,
      previousStatus: application.status,
      newStatus: updated.status,
      reason: input.reason,
    });

    return BusinessApplicationMapper.toApplicationDto(updated);
  }

  async approve(
    actorId: string,
    id: string,
    requestId?: string,
  ): Promise<ApproveApplicationResponseDto> {
    const application = await this.loadApplicationOrThrow(id);

    // Idempotent replay: already approved applications return the existing business.
    if (application.status === BusinessApplicationStatuses.Approved) {
      if (!application.createdBusinessId) {
        throw new ConflictError(
          ErrorCodes.Resource.Conflict,
          "Application is approved but has no linked business.",
          { applicationId: id },
        );
      }
      return {
        businessId: application.createdBusinessId,
        slug: undefined,
        idempotent: true,
      };
    }

    if (application.status !== BusinessApplicationStatuses.UnderReview) {
      assertApplicationStatusTransition(
        application.status,
        BusinessApplicationStatuses.Approved,
      );
    }

    const result = await this.applicationRepository.approveViaRpc(
      id,
      actorId,
      requestId,
    );

    if (!result.idempotent) {
      await this.auditRepository.write({
        actorUserId: actorId,
        action: "business.application.approved",
        entityType: "business_application",
        entityId: id,
        requestId,
        previousStatus: application.status,
        newStatus: BusinessApplicationStatuses.Approved,
        metadata: { businessId: result.businessId, slug: result.slug },
      });
    }

    return {
      businessId: result.businessId,
      slug: result.slug,
      idempotent: result.idempotent,
    };
  }

  async reject(
    actorId: string,
    id: string,
    input: RejectApplicationRequestDto,
    requestId?: string,
  ): Promise<BusinessApplicationResponseDto> {
    const application = await this.loadApplicationOrThrow(id);
    assertApplicationStatusTransition(
      application.status,
      BusinessApplicationStatuses.Rejected,
    );

    const updated = await this.applicationRepository.updateStatusAdmin(id, {
      status: BusinessApplicationStatuses.Rejected,
      rejectedAt: this.now(),
      rejectionReason: input.reason,
    });

    await this.reviewRepository.create({
      applicationId: id,
      reviewerUserId: actorId,
      action: "rejected",
      previousStatus: application.status,
      newStatus: BusinessApplicationStatuses.Rejected,
      reason: input.reason,
    });

    await this.auditRepository.write({
      actorUserId: actorId,
      action: "business.application.rejected",
      entityType: "business_application",
      entityId: id,
      requestId,
      previousStatus: application.status,
      newStatus: updated.status,
      reason: input.reason,
    });

    return BusinessApplicationMapper.toApplicationDto(updated);
  }

  async listCategories(): Promise<BusinessCategoryResponseDto[]> {
    const categories = await this.applicationRepository.listCategories();
    return categories.map(BusinessApplicationMapper.toCategoryDto);
  }

  async listRequirements(
    categoryId: string,
  ): Promise<BusinessDocumentRequirementResponseDto[]> {
    const category = await this.applicationRepository.findCategoryById(
      categoryId,
    );
    if (!category) throw new CategoryNotFoundError(categoryId);

    const requirements = await this.applicationRepository.listRequirements(
      categoryId,
    );
    return requirements.map(BusinessApplicationMapper.toRequirementDto);
  }
}
