export type BusinessMembership = {
  membershipId: string
  businessId: string
  role: string
  status: string
  business: {
    id: string
    slug: string
    displayName: string
    logoPath: string | null
    status: string
    verificationStatus: string
  }
}

export type BusinessInvitation = {
  id: string
  businessId: string
  email: string
  role: string
  status: string
  invitedBy: string
  expiresAt: string
  acceptedBy: string | null
  acceptedAt: string | null
  revokedAt: string | null
  createdAt: string
  updatedAt: string
}

export type InvitableRole =
  | 'manager'
  | 'service_advisor'
  | 'mechanic'
  | 'cashier'
  | 'receptionist'
  | 'staff'

export const INVITABLE_ROLES: InvitableRole[] = [
  'manager',
  'service_advisor',
  'mechanic',
  'cashier',
  'receptionist',
  'staff',
]
