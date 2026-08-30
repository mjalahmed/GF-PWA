import {
  ReviewModerationActions,
  ReviewReportStatuses,
  ReviewStatuses,
  type ReviewModerationAction,
  type ReviewStatus,
} from "../../core/constants/statuses.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import { permissionsForMembershipRole } from "../../core/auth/business-authorization.middleware.ts";
import type { PaginationMeta } from "../../core/types/context.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BusinessRepository } from "../business-management/business.repository.interface.ts";
import type { MembershipRepository } from "../business-management/membership.repository.interface.ts";
import type {
  AdminReviewDto,
  BusinessReviewDto,
  CreateReviewRequestDto,
  CustomerReviewDto,
  ModerateReviewRequestDto,
  PublicReviewDto,
  ReportReviewRequestDto,
  ResolveReportActionRequestDto,
  ReviewEligibilityDto,
  ReviewReportDto,
  ReviewResponseRequestDto,
  UpdateReviewRequestDto,
} from "./review.dto.ts";
import {
  ReviewAccessDeniedError,
  ReviewEligibilityNotFoundError,
  ReviewNotEditableError,
  ReviewNotEligibleError,
  ReviewNotFoundError,
  ReviewReportNotFoundError,
  ReviewResponseNotFoundError,
  ReviewSelfReviewDeniedError,
  ReviewsDisabledError,
} from "./review.errors.ts";
import { ReviewMapper, type ReviewAudience } from "./review.mapper.ts";
import type { ReviewRepository } from "./review.repository.interface.ts";
import {
  assertModerationTransition,
  canCustomerEditReview,
  isEligibilityUsable,
  targetStatusForModerationAction,
  validateDimensionRatings,
  validateOverallRating,
} from "./review.transitions.ts";
import type { ReviewRecord } from "./review.types.ts";

type ActorContext = {
  userId: string;
  roles?: string[];
  globalPermissions?: string[];
};

export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    private readonly businessRepository: BusinessRepository,
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
        entityType: "review",
        entityId: input.entityId,
        metadata: input.metadata ?? {},
      });
    } catch {
      // Notifications must not roll back review mutations.
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

  private isModerator(actor: ActorContext): boolean {
    return this.isAdmin(actor) ||
      (actor.globalPermissions ?? []).includes(Permissions.Review.Moderate);
  }

  private async assertReviewsEnabled(businessId: string): Promise<void> {
    const settings = await this.businessRepository.findSettings(businessId, "admin");
    if (!settings?.reviewsEnabled) throw new ReviewsDisabledError();
  }

  private async assertNotBusinessMember(
    businessId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.businessRepository.findActiveMembership(
      businessId,
      userId,
    );
    if (membership) throw new ReviewSelfReviewDeniedError();
  }

  private async hasBusinessReviewRead(
    businessId: string,
    actor: ActorContext,
  ): Promise<boolean> {
    if (this.isModerator(actor)) return true;
    const membership = await this.businessRepository.findActiveMembership(
      businessId,
      actor.userId,
    );
    if (!membership) return false;
    const perms = permissionsForMembershipRole(membership.role);
    return perms.includes(Permissions.BusinessReview.Read);
  }

  private async hasBusinessReviewRespond(
    businessId: string,
    actor: ActorContext,
  ): Promise<boolean> {
    if (this.isAdmin(actor)) return true;
    const membership = await this.businessRepository.findActiveMembership(
      businessId,
      actor.userId,
    );
    if (!membership) return false;
    const perms = permissionsForMembershipRole(membership.role);
    return perms.includes(Permissions.BusinessReview.Respond);
  }

  private async loadEligibilityContextForReview(record: ReviewRecord) {
    return this.reviewRepository.loadEligibilityContext(record.eligibilityId);
  }

  private async toAudienceDto(
    record: ReviewRecord,
    audience: ReviewAudience,
  ) {
    const context = audience === "public"
      ? null
      : await this.loadEligibilityContextForReview(record);
    return ReviewMapper.toAudienceDto(record, audience, context ?? undefined);
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

  async listEligibilitiesForActor(
    actor: ActorContext,
    filters?: { isUsed?: boolean },
  ): Promise<ReviewEligibilityDto[]> {
    const items = await this.reviewRepository.listEligibilities({
      customerId: actor.userId,
      isUsed: filters?.isUsed,
    });
    return items.map(ReviewMapper.toEligibilityDto);
  }

  async getEligibility(
    actor: ActorContext,
    eligibilityId: string,
  ): Promise<ReviewEligibilityDto> {
    const eligibility = await this.reviewRepository.findEligibilityById(eligibilityId);
    if (!eligibility || eligibility.customerId !== actor.userId) {
      throw new ReviewEligibilityNotFoundError(eligibilityId);
    }
    return ReviewMapper.toEligibilityDto(eligibility);
  }

  async ensureEligibilityForInvoice(
    invoiceId: string,
    actorUserId?: string,
    requestId?: string,
  ): Promise<string | null> {
    const before = await this.reviewRepository.findEligibilityByInvoiceId(invoiceId);

    const eligibilityId = await this.reviewRepository.ensureEligibility({
      invoiceId,
      actorUserId: actorUserId ?? null,
      requestId: requestId ?? null,
    });

    if (!eligibilityId || before) return eligibilityId;

    const eligibility = await this.reviewRepository.findEligibilityById(eligibilityId);
    if (eligibility) {
      await this.safeNotify({
        userId: eligibility.customerId,
        type: "review_eligibility_created",
        title: "You can leave a review",
        body: "Your recent service qualifies you to leave a verified review.",
        entityId: eligibility.id,
        metadata: { businessId: eligibility.businessId },
      });
    }

    return eligibilityId;
  }

  async ensureEligibilityForAppointment(
    appointmentId: string,
    actorUserId?: string,
    requestId?: string,
  ): Promise<string | null> {
    const before = await this.reviewRepository.findEligibilityByAppointmentId(
      appointmentId,
    );

    const eligibilityId = await this.reviewRepository.ensureEligibility({
      appointmentId,
      actorUserId: actorUserId ?? null,
      requestId: requestId ?? null,
    });

    if (!eligibilityId || before) return eligibilityId;

    const eligibility = await this.reviewRepository.findEligibilityById(eligibilityId);
    if (eligibility) {
      await this.safeNotify({
        userId: eligibility.customerId,
        type: "review_eligibility_created",
        title: "You can leave a review",
        body: "Your recent service qualifies you to leave a verified review.",
        entityId: eligibility.id,
        metadata: { businessId: eligibility.businessId },
      });
    }

    return eligibilityId;
  }

  async createReview(
    actor: ActorContext,
    body: CreateReviewRequestDto,
    requestId?: string,
  ): Promise<CustomerReviewDto> {
    const eligibility = await this.reviewRepository.findEligibilityById(body.eligibilityId);
    if (!eligibility || eligibility.customerId !== actor.userId) {
      throw new ReviewEligibilityNotFoundError(body.eligibilityId);
    }

    if (!isEligibilityUsable(eligibility)) {
      throw new ReviewNotEligibleError();
    }

    await this.assertReviewsEnabled(eligibility.businessId);
    await this.assertNotBusinessMember(eligibility.businessId, actor.userId);

    validateOverallRating(body.overallRating);
    validateDimensionRatings(body.ratings);

    const reviewId = await this.reviewRepository.createReview({
      eligibilityId: body.eligibilityId,
      customerId: actor.userId,
      overallRating: body.overallRating,
      comment: body.comment ?? null,
      ratings: body.ratings,
      requestId,
    });

    const record = await this.reviewRepository.findReviewById(reviewId);
    if (!record) throw new ReviewNotFoundError(reviewId);

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "review.created",
      entityType: "review",
      entityId: reviewId,
      requestId,
      newStatus: ReviewStatuses.Published,
    });

    await this.notifyBusinessStaff(eligibility.businessId, {
      type: "review_created",
      title: "New customer review",
      body: "A verified customer review was published.",
      entityId: reviewId,
    });

    return this.toAudienceDto(record, "customer") as CustomerReviewDto;
  }

  async listOwnReviews(
    actor: ActorContext,
    filters: {
      businessId?: string;
      status?: ReviewStatus | ReviewStatus[];
      sort?: "newest" | "highest" | "lowest";
      minRating?: number;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: CustomerReviewDto[]; pagination: PaginationMeta }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const result = await this.reviewRepository.listReviews({
      customerId: actor.userId,
      businessId: filters.businessId,
      status: filters.status,
      sort: filters.sort,
      minRating: filters.minRating,
      page,
      pageSize,
    });

    const items = await Promise.all(
      result.items.map((record) => this.toAudienceDto(record, "customer")),
    ) as CustomerReviewDto[];

    return {
      items,
      pagination: this.paginationMeta(page, pageSize, result.total),
    };
  }

  async getReview(
    actor: ActorContext | null,
    reviewId: string,
  ): Promise<PublicReviewDto | CustomerReviewDto | BusinessReviewDto | AdminReviewDto> {
    const record = await this.reviewRepository.findReviewById(reviewId);
    if (!record) throw new ReviewNotFoundError(reviewId);

    if (!actor) {
      if (record.status !== ReviewStatuses.Published) {
        throw new ReviewNotFoundError(reviewId);
      }
      return this.toAudienceDto(record, "public");
    }

    if (record.customerId === actor.userId) {
      return this.toAudienceDto(record, "customer");
    }

    if (this.isModerator(actor)) {
      return this.toAudienceDto(record, "admin");
    }

    const canReadBusiness = await this.hasBusinessReviewRead(
      record.businessId,
      actor,
    );
    if (canReadBusiness) {
      return this.toAudienceDto(record, "business");
    }

    if (record.status !== ReviewStatuses.Published) {
      throw new ReviewAccessDeniedError();
    }

    return this.toAudienceDto(record, "public");
  }

  async updateOwnReview(
    actor: ActorContext,
    reviewId: string,
    body: UpdateReviewRequestDto,
  ): Promise<CustomerReviewDto> {
    const record = await this.reviewRepository.findReviewById(reviewId);
    if (!record) throw new ReviewNotFoundError(reviewId);
    if (record.customerId !== actor.userId) throw new ReviewAccessDeniedError();
    if (!canCustomerEditReview(record.status)) throw new ReviewNotEditableError();

    validateOverallRating(body.overallRating);
    validateDimensionRatings(body.ratings);

    const updated = await this.reviewRepository.updateReview({
      reviewId,
      overallRating: body.overallRating,
      comment: body.comment ?? null,
      ratings: body.ratings,
      editedAt: new Date().toISOString(),
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "review.updated",
      entityType: "review",
      entityId: reviewId,
      previousStatus: record.status,
      newStatus: updated.status,
    });

    return this.toAudienceDto(updated, "customer") as CustomerReviewDto;
  }

  async reportReview(
    actor: ActorContext,
    reviewId: string,
    body: ReportReviewRequestDto,
  ): Promise<ReviewReportDto> {
    const record = await this.reviewRepository.findReviewById(reviewId);
    if (!record) throw new ReviewNotFoundError(reviewId);
    if (record.customerId === actor.userId) {
      throw new ReviewAccessDeniedError("You cannot report your own review.");
    }
    if (record.status !== ReviewStatuses.Published) {
      throw new ReviewNotFoundError(reviewId);
    }

    const report = await this.reviewRepository.createReport({
      reviewId,
      reportedBy: actor.userId,
      reasonCode: body.reasonCode,
      details: body.details ?? null,
    });

    return ReviewMapper.toReportDto(report);
  }

  async listPublicBusinessReviews(
    businessId: string,
    actor: ActorContext | null,
    filters: {
      status?: ReviewStatus | ReviewStatus[];
      sort?: "newest" | "highest" | "lowest";
      minRating?: number;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{
    items: Array<PublicReviewDto | BusinessReviewDto>;
    pagination: PaginationMeta;
  }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const canReadAll = actor
      ? await this.hasBusinessReviewRead(businessId, actor)
      : false;

    const status = canReadAll
      ? filters.status
      : ReviewStatuses.Published;

    const result = await this.reviewRepository.listReviews({
      businessId,
      status,
      sort: filters.sort,
      minRating: filters.minRating,
      page,
      pageSize,
    });

    const audience: ReviewAudience = canReadAll ? "business" : "public";
    const items = await Promise.all(
      result.items.map((record) => this.toAudienceDto(record, audience)),
    );

    return {
      items: items as Array<PublicReviewDto | BusinessReviewDto>,
      pagination: this.paginationMeta(page, pageSize, result.total),
    };
  }

  async respondToReview(
    actor: ActorContext,
    businessId: string,
    reviewId: string,
    body: ReviewResponseRequestDto,
  ): Promise<BusinessReviewDto> {
    if (!(await this.hasBusinessReviewRespond(businessId, actor))) {
      throw new ReviewAccessDeniedError();
    }

    const record = await this.reviewRepository.findReviewById(reviewId);
    if (!record || record.businessId !== businessId) {
      throw new ReviewNotFoundError(reviewId);
    }
    if (record.status !== ReviewStatuses.Published) {
      throw new ReviewNotEditableError("Only published reviews can be responded to.");
    }

    const updated = await this.reviewRepository.upsertResponse({
      reviewId,
      businessId,
      respondedBy: actor.userId,
      response: body.response,
    });

    return this.toAudienceDto(updated, "business") as BusinessReviewDto;
  }

  async updateResponse(
    actor: ActorContext,
    businessId: string,
    reviewId: string,
    body: ReviewResponseRequestDto,
  ): Promise<BusinessReviewDto> {
    if (!(await this.hasBusinessReviewRespond(businessId, actor))) {
      throw new ReviewAccessDeniedError();
    }

    const record = await this.reviewRepository.findReviewById(reviewId);
    if (!record || record.businessId !== businessId) {
      throw new ReviewNotFoundError(reviewId);
    }
    if (!record.response) throw new ReviewResponseNotFoundError();

    const updated = await this.reviewRepository.updateResponse({
      reviewId,
      businessId,
      respondedBy: actor.userId,
      response: body.response,
    });

    return this.toAudienceDto(updated, "business") as BusinessReviewDto;
  }

  async listAdminReviews(
    actor: ActorContext,
    filters: {
      customerId?: string;
      businessId?: string;
      status?: ReviewStatus | ReviewStatus[];
      sort?: "newest" | "highest" | "lowest";
      minRating?: number;
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: AdminReviewDto[]; pagination: PaginationMeta }> {
    if (!this.isModerator(actor)) throw new ReviewAccessDeniedError();

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const result = await this.reviewRepository.listReviews({
      customerId: filters.customerId,
      businessId: filters.businessId,
      status: filters.status,
      sort: filters.sort,
      minRating: filters.minRating,
      page,
      pageSize,
    });

    const items = await Promise.all(
      result.items.map((record) => this.toAudienceDto(record, "admin")),
    ) as AdminReviewDto[];

    return {
      items,
      pagination: this.paginationMeta(page, pageSize, result.total),
    };
  }

  async moderateReview(
    actor: ActorContext,
    reviewId: string,
    action: Extract<ReviewModerationAction, "hide" | "restore" | "remove">,
    body: ModerateReviewRequestDto,
    requestId?: string,
  ): Promise<AdminReviewDto> {
    if (!this.isModerator(actor)) throw new ReviewAccessDeniedError();

    const record = await this.reviewRepository.findReviewById(reviewId);
    if (!record) throw new ReviewNotFoundError(reviewId);

    const newStatus = targetStatusForModerationAction(action);
    if (!newStatus) throw new ReviewNotEditableError();

    assertModerationTransition(record.status, newStatus);

    const updated = await this.reviewRepository.moderateReview({
      reviewId,
      moderatorId: actor.userId,
      action,
      previousStatus: record.status,
      newStatus,
      reason: body.reason ?? null,
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: `review.${action}`,
      entityType: "review",
      entityId: reviewId,
      requestId,
      previousStatus: record.status,
      newStatus,
    });

    return this.toAudienceDto(updated, "admin") as AdminReviewDto;
  }

  async listAdminReports(
    actor: ActorContext,
    filters: {
      status?: string | string[];
      page?: number;
      pageSize?: number;
    },
  ): Promise<{ items: ReviewReportDto[]; pagination: PaginationMeta }> {
    if (!this.isModerator(actor)) throw new ReviewAccessDeniedError();

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const result = await this.reviewRepository.listReports({
      status: filters.status as never,
      page,
      pageSize,
    });

    return {
      items: result.items.map(ReviewMapper.toReportDto),
      pagination: this.paginationMeta(page, pageSize, result.total),
    };
  }

  async dismissReport(
    actor: ActorContext,
    reportId: string,
    body: ModerateReviewRequestDto,
  ): Promise<ReviewReportDto> {
    if (!this.isModerator(actor)) throw new ReviewAccessDeniedError();

    const report = await this.reviewRepository.findReportById(reportId);
    if (!report) throw new ReviewReportNotFoundError(reportId);

    const resolved = await this.reviewRepository.resolveReport({
      reportId,
      resolvedBy: actor.userId,
      status: ReviewReportStatuses.Dismissed,
      moderationAction: ReviewModerationActions.DismissReport,
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "review.report_dismissed",
      entityType: "review_report",
      entityId: reportId,
      metadata: { reason: body.reason ?? null, reviewId: report.reviewId },
    });

    return ReviewMapper.toReportDto(resolved);
  }

  async actionReport(
    actor: ActorContext,
    reportId: string,
    body: ResolveReportActionRequestDto,
  ): Promise<ReviewReportDto> {
    if (!this.isModerator(actor)) throw new ReviewAccessDeniedError();

    const report = await this.reviewRepository.findReportById(reportId);
    if (!report) throw new ReviewReportNotFoundError(reportId);

    const review = await this.reviewRepository.findReviewById(report.reviewId);
    if (!review) throw new ReviewNotFoundError(report.reviewId);

    const moderationAction = body.action === "hide"
      ? ReviewModerationActions.Hide
      : body.action === "remove"
      ? ReviewModerationActions.Remove
      : ReviewModerationActions.Flag;

    const newStatus = targetStatusForModerationAction(moderationAction);
    if (!newStatus) throw new ReviewNotEditableError();

    assertModerationTransition(review.status, newStatus);

    const resolved = await this.reviewRepository.resolveReport({
      reportId,
      resolvedBy: actor.userId,
      status: ReviewReportStatuses.ActionTaken,
      moderationAction,
      reviewModeration: {
        reviewId: review.id,
        moderatorId: actor.userId,
        action: moderationAction,
        previousStatus: review.status,
        newStatus,
        reason: body.reason ?? null,
        metadata: { reportId },
      },
    });

    await this.auditRepository.write({
      actorUserId: actor.userId,
      action: "review.report_action_taken",
      entityType: "review_report",
      entityId: reportId,
      previousStatus: review.status,
      newStatus,
      metadata: { action: body.action, reviewId: review.id },
    });

    return ReviewMapper.toReportDto(resolved);
  }
}
