import { Permissions } from "../../core/constants/permissions.ts";
import { BusinessStatuses, BusinessVerificationStatuses } from "../../core/constants/statuses.ts";
import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BusinessRepository } from "./business.repository.interface.ts";
import type { BranchRepository } from "./branch.repository.interface.ts";
import type { ScheduleRepository } from "./schedule.repository.interface.ts";
import {
  BusinessAccessDeniedError,
  BusinessInactiveError,
  BusinessNotFoundError,
} from "./business.errors.ts";
import { BusinessMapper } from "./business.mapper.ts";
import type {
  BusinessPublicResponseDto,
  BusinessResponseDto,
  BusinessSettingsResponseDto,
  MyBusinessMembershipResponseDto,
  UpdateBusinessRequestDto,
  UpdateBusinessSettingsRequestDto,
} from "./business.dto.ts";
import type { BusinessRecord } from "./business.types.ts";

export class BusinessService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly branchRepository: BranchRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  private async loadBusinessOrThrow(businessId: string): Promise<BusinessRecord> {
    const business = await this.businessRepository.findById(businessId, "admin");
    if (!business) throw new BusinessNotFoundError(businessId);
    return business;
  }

  assertActiveBusiness(business: BusinessRecord): void {
    if (business.status !== BusinessStatuses.Active) {
      throw new BusinessInactiveError(business.status);
    }
  }

  async getById(businessId: string): Promise<BusinessResponseDto> {
    const business = await this.loadBusinessOrThrow(businessId);
    return BusinessMapper.toBusinessDto(business);
  }

  async getPublic(businessId: string): Promise<BusinessPublicResponseDto> {
    const business = await this.businessRepository.findPublicById(businessId);
    if (!business) throw new BusinessNotFoundError(businessId);

    const [branches, openingHours] = await Promise.all([
      this.branchRepository.listByBusiness(businessId, true),
      this.scheduleRepository.listOpeningHours(businessId, null),
    ]);

    return BusinessMapper.toPublicDto({ business, branches, openingHours });
  }

  async updateProfile(
    actorUserId: string,
    businessId: string,
    input: UpdateBusinessRequestDto,
    requestId?: string,
  ): Promise<BusinessResponseDto> {
    const existing = await this.loadBusinessOrThrow(businessId);
    this.assertActiveBusiness(existing);

    const updated = await this.businessRepository.updateFields(businessId, {
      displayName: input.displayName,
      description: input.description,
      phone: input.phone,
      email: input.email,
      website: input.website,
      logoPath: input.logoPath,
      coverPath: input.coverPath,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "business.updated",
      entityType: "business",
      entityId: businessId,
      requestId,
      oldValues: {
        displayName: existing.displayName,
        description: existing.description,
        phone: existing.phone,
        email: existing.email,
        website: existing.website,
        logoPath: existing.logoPath,
        coverPath: existing.coverPath,
      },
      newValues: {
        displayName: updated.displayName,
        description: updated.description,
        phone: updated.phone,
        email: updated.email,
        website: updated.website,
        logoPath: updated.logoPath,
        coverPath: updated.coverPath,
      },
      metadata: { businessId },
    });

    return BusinessMapper.toBusinessDto(updated);
  }

  async getSettings(businessId: string): Promise<BusinessSettingsResponseDto> {
    await this.loadBusinessOrThrow(businessId);
    const settings = await this.businessRepository.findSettings(businessId);
    if (!settings) throw new BusinessNotFoundError(businessId);
    return BusinessMapper.toSettingsDto(settings);
  }

  async updateSettings(
    actorUserId: string,
    businessId: string,
    input: UpdateBusinessSettingsRequestDto,
    requestId?: string,
  ): Promise<BusinessSettingsResponseDto> {
    const business = await this.loadBusinessOrThrow(businessId);
    this.assertActiveBusiness(business);

    const existing = await this.businessRepository.findSettings(businessId);
    if (!existing) throw new BusinessNotFoundError(businessId);

    const updated = await this.businessRepository.updateSettings(businessId, input);

    await this.auditRepository.write({
      actorUserId,
      action: "business.settings.updated",
      entityType: "business_settings",
      entityId: updated.id,
      requestId,
      metadata: { businessId },
    });

    return BusinessMapper.toSettingsDto(updated);
  }

  async listMyMemberships(
    userId: string,
  ): Promise<MyBusinessMembershipResponseDto[]> {
    const items = await this.businessRepository.listActiveMembershipsForUser(userId);
    return items.map(BusinessMapper.toMyMembershipDto);
  }

  canAccessInternal(
    business: BusinessRecord,
    globalPermissions: string[],
  ): boolean {
    if (globalPermissions.includes(Permissions.Business.Read)) return true;
    if (globalPermissions.includes(Permissions.Business.View)) return true;
    if (business.status === BusinessStatuses.Active &&
      business.verificationStatus === BusinessVerificationStatuses.Verified) {
      return globalPermissions.includes(Permissions.Business.PublicRead);
    }
    return false;
  }

  assertInternalAccessOrMember(
    business: BusinessRecord,
    hasMembership: boolean,
    globalPermissions: string[],
  ): void {
    if (hasMembership) return;
    if (this.canAccessInternal(business, globalPermissions)) return;
    throw new BusinessAccessDeniedError();
  }
}
