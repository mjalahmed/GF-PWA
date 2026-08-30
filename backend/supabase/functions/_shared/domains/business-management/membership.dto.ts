export type MembershipResponseDto = {
  id: string;
  businessId: string;
  userId: string;
  role: string;
  status: string;
  invitedBy: string | null;
  invitedAt: string;
  acceptedAt: string | null;
  suspendedAt: string | null;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateMembershipRoleResponseDto = {
  membershipId: string;
  previousRole: string;
  newRole: string;
};

export type {
  UpdateMembershipRoleRequestDto,
} from "./membership.schemas.ts";
