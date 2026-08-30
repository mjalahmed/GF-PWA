import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BusinessRepository } from "./business.repository.interface.ts";
import type { InvitationRepository } from "./invitation.repository.interface.ts";
import { InvitationNotFoundError } from "./business.errors.ts";
import { InvitationMapper } from "./invitation.mapper.ts";
import { hashInvitationToken } from "./invitation.repository.ts";
import type {
  AcceptInvitationResponseDto,
  CreateInvitationRequestDto,
  CreateInvitationResponseDto,
  InvitationResponseDto,
} from "./invitation.dto.ts";
import type { MembershipRole } from "./business.types.ts";

export { hashInvitationToken };

function generateInvitationToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly businessRepository: BusinessRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  async list(businessId: string): Promise<InvitationResponseDto[]> {
    const invitations = await this.invitationRepository.listByBusiness(businessId);
    return invitations.map(InvitationMapper.toDto);
  }

  async create(
    actorUserId: string,
    businessId: string,
    input: CreateInvitationRequestDto,
    requestId?: string,
  ): Promise<CreateInvitationResponseDto> {
    const email = input.email.trim().toLowerCase();
    await this.invitationRepository.revokePendingForEmail(businessId, email);

    const rawToken = generateInvitationToken();
    const tokenHash = await hashInvitationToken(rawToken);
    const expiresInDays = input.expiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();

    const invitation = await this.invitationRepository.create({
      businessId,
      email,
      membershipRole: input.role as MembershipRole,
      tokenHash,
      invitedBy: actorUserId,
      expiresAt,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "business.invitation.created",
      entityType: "business_invitation",
      entityId: invitation.id,
      requestId,
      metadata: { businessId, email, role: input.role },
    });

    await this.safeNotifyByEmail({
      email,
      type: "business_invitation_created",
      title: "Business invitation",
      body: "You have been invited to join a business team.",
      entityType: "business_invitation",
      entityId: invitation.id,
      metadata: { businessId, role: input.role },
    });

    return {
      invitation: InvitationMapper.toDto(invitation),
      token: rawToken,
    };
  }

  async revoke(
    actorUserId: string,
    businessId: string,
    invitationId: string,
    requestId?: string,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.invitationRepository.revoke(
      businessId,
      invitationId,
    );

    await this.auditRepository.write({
      actorUserId,
      action: "business.invitation.revoked",
      entityType: "business_invitation",
      entityId: invitationId,
      requestId,
      metadata: { businessId, email: invitation.email },
    });

    return InvitationMapper.toDto(invitation);
  }

  async accept(
    userId: string,
    userEmail: string,
    rawToken: string,
    requestId?: string,
  ): Promise<AcceptInvitationResponseDto> {
    const tokenHash = await hashInvitationToken(rawToken);
    const result = await this.invitationRepository.acceptViaRpc(
      tokenHash,
      userId,
      userEmail,
    );

    await this.auditRepository.write({
      actorUserId: userId,
      action: "business.invitation.accepted",
      entityType: "business_invitation",
      entityId: result.invitationId,
      requestId,
      metadata: {
        businessId: result.businessId,
        membershipId: result.membershipId,
        role: result.role,
      },
    });

    await this.safeNotify({
      userId,
      type: "business_invitation_accepted",
      title: "Invitation accepted",
      body: "You have joined the business team.",
      entityType: "business_invitation",
      entityId: result.invitationId,
      metadata: { businessId: result.businessId, role: result.role },
    });

    return {
      invitationId: result.invitationId,
      membershipId: result.membershipId,
      businessId: result.businessId,
      role: result.role,
    };
  }

  async getById(
    businessId: string,
    invitationId: string,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.invitationRepository.findById(
      businessId,
      invitationId,
    );
    if (!invitation) throw new InvitationNotFoundError(invitationId);
    return InvitationMapper.toDto(invitation);
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
      // Notification failure must not roll back.
    }
  }

  private async safeNotifyByEmail(_input: {
    email: string;
    type: string;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    // Invitee may not have an account yet; notification deferred until accept.
  }
}
