export type InvitationResponseDto = {
  id: string;
  businessId: string;
  email: string;
  role: string;
  status: string;
  invitedBy: string;
  expiresAt: string;
  acceptedBy: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateInvitationResponseDto = {
  invitation: InvitationResponseDto;
  token: string;
};

export type AcceptInvitationResponseDto = {
  invitationId: string;
  membershipId: string;
  businessId: string;
  role: string;
};

export type {
  CreateInvitationRequestDto,
  AcceptInvitationRequestDto,
  InvitationTokenParamsDto,
} from "./invitation.schemas.ts";
