import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BusinessRepository } from "./business.repository.interface.ts";
import type { MembershipRepository } from "./membership.repository.interface.ts";
import {
  FinalOwnerProtectedError,
  ManagerCannotModifyOwnerError,
  MembershipNotFoundError,
  OnlyOwnerCanAssignOwnerError,
} from "./business.errors.ts";
import { MembershipMapper } from "./membership.mapper.ts";
import type {
  MembershipResponseDto,
  UpdateMembershipRoleRequestDto,
  UpdateMembershipRoleResponseDto,
} from "./membership.dto.ts";
import type { BusinessMembershipRecord, MembershipRole } from "./business.types.ts";

export class MembershipService {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  private async loadMembershipOrThrow(
    businessId: string,
    membershipId: string,
  ): Promise<BusinessMembershipRecord> {
    const membership = await this.membershipRepository.findById(
      businessId,
      membershipId,
    );
    if (!membership) throw new MembershipNotFoundError(membershipId);
    return membership;
  }

  assertCanModifyTarget(
    actorRole: MembershipRole,
    target: BusinessMembershipRecord,
    newRole?: MembershipRole,
  ): void {
    if (actorRole === "manager") {
      if (target.role === "owner" || newRole === "owner") {
        throw new ManagerCannotModifyOwnerError();
      }
    }
    if (newRole === "owner" && actorRole !== "owner") {
      throw new OnlyOwnerCanAssignOwnerError();
    }
  }

  async assertNotFinalOwnerChange(
    businessId: string,
    target: BusinessMembershipRecord,
    action: "demote" | "suspend" | "remove",
  ): Promise<void> {
    if (target.role !== "owner" || target.status !== "active") return;

    const ownerCount = await this.businessRepository.countActiveOwners(businessId);
    if (ownerCount <= 1) {
      const messages = {
        demote: "The final active owner cannot be demoted.",
        suspend: "The final active owner cannot be suspended.",
        remove: "The final active owner cannot be removed.",
      };
      throw new FinalOwnerProtectedError(messages[action]);
    }
  }

  async list(businessId: string): Promise<MembershipResponseDto[]> {
    const members = await this.membershipRepository.listByBusiness(businessId);
    return members.map(MembershipMapper.toDto);
  }

  async updateRole(
    actorUserId: string,
    actorRole: MembershipRole,
    businessId: string,
    membershipId: string,
    input: UpdateMembershipRoleRequestDto,
    requestId?: string,
  ): Promise<UpdateMembershipRoleResponseDto> {
    const target = await this.loadMembershipOrThrow(businessId, membershipId);
    this.assertCanModifyTarget(actorRole, target, input.role);

    if (target.role === "owner" && input.role !== "owner") {
      await this.assertNotFinalOwnerChange(businessId, target, "demote");
    }
    if (input.role === "owner" && actorRole !== "owner") {
      throw new OnlyOwnerCanAssignOwnerError();
    }

    const result = await this.membershipRepository.updateRoleViaRpc(
      membershipId,
      input.role,
      actorUserId,
    );

    await this.auditRepository.write({
      actorUserId,
      action: input.role === "owner"
        ? "business.membership.owner_assigned"
        : "business.membership.role_updated",
      entityType: "business_membership",
      entityId: membershipId,
      requestId,
      previousStatus: result.previousRole,
      newStatus: result.newRole,
      metadata: { businessId, userId: target.userId },
    });

    await this.safeNotify({
      userId: target.userId,
      type: "business_membership_role_changed",
      title: "Membership role updated",
      body: `Your role was changed to ${input.role}.`,
      entityType: "business_membership",
      entityId: membershipId,
      metadata: { businessId, role: input.role },
    });

    return result;
  }

  async suspend(
    actorUserId: string,
    actorRole: MembershipRole,
    businessId: string,
    membershipId: string,
    requestId?: string,
  ): Promise<{ membershipId: string }> {
    const target = await this.loadMembershipOrThrow(businessId, membershipId);
    if (target.role === "owner" && actorRole !== "owner") {
      throw new ManagerCannotModifyOwnerError(
        "Only owners can suspend owner memberships.",
      );
    }
    await this.assertNotFinalOwnerChange(businessId, target, "suspend");

    const result = await this.membershipRepository.suspendViaRpc(
      membershipId,
      actorUserId,
    );

    await this.auditRepository.write({
      actorUserId,
      action: "business.membership.suspended",
      entityType: "business_membership",
      entityId: membershipId,
      requestId,
      previousStatus: "active",
      newStatus: "suspended",
      metadata: { businessId, userId: target.userId },
    });

    await this.safeNotify({
      userId: target.userId,
      type: "business_membership_suspended",
      title: "Membership suspended",
      body: "Your access to this business has been suspended.",
      entityType: "business_membership",
      entityId: membershipId,
      metadata: { businessId },
    });

    return result;
  }

  async restore(
    actorUserId: string,
    businessId: string,
    membershipId: string,
    requestId?: string,
  ): Promise<{ membershipId: string }> {
    const target = await this.loadMembershipOrThrow(businessId, membershipId);

    const result = await this.membershipRepository.restoreViaRpc(
      membershipId,
      actorUserId,
    );

    await this.auditRepository.write({
      actorUserId,
      action: "business.membership.restored",
      entityType: "business_membership",
      entityId: membershipId,
      requestId,
      previousStatus: "suspended",
      newStatus: "active",
      metadata: { businessId, userId: target.userId },
    });

    await this.safeNotify({
      userId: target.userId,
      type: "business_membership_restored",
      title: "Membership restored",
      body: "Your access to this business has been restored.",
      entityType: "business_membership",
      entityId: membershipId,
      metadata: { businessId },
    });

    return result;
  }

  async remove(
    actorUserId: string,
    actorRole: MembershipRole,
    businessId: string,
    membershipId: string,
    requestId?: string,
  ): Promise<{ membershipId: string; idempotent: boolean }> {
    const target = await this.loadMembershipOrThrow(businessId, membershipId);
    if (target.role === "owner" && actorRole !== "owner") {
      throw new ManagerCannotModifyOwnerError(
        "Only owners can remove owner memberships.",
      );
    }
    await this.assertNotFinalOwnerChange(businessId, target, "remove");

    const result = await this.membershipRepository.removeViaRpc(
      membershipId,
      actorUserId,
    );

    if (!result.idempotent) {
      await this.auditRepository.write({
        actorUserId,
        action: "business.membership.removed",
        entityType: "business_membership",
        entityId: membershipId,
        requestId,
        metadata: { businessId, userId: target.userId },
      });

      await this.safeNotify({
        userId: target.userId,
        type: "business_membership_removed",
        title: "Membership removed",
        body: "Your access to this business has been removed.",
        entityType: "business_membership",
        entityId: membershipId,
        metadata: { businessId },
      });
    }

    return result;
  }

  private async safeNotify(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.businessRepository.insertNotification(input);
    } catch {
      // Notification failure must not roll back membership changes.
    }
  }
}
