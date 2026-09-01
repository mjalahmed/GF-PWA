import type {
  BusinessInvitation,
  BusinessMembership,
  InvitableRole,
} from '../../types/business'
import { apiClient, buildQuery } from './client'
import { businessPaths } from './paths'

export async function listMyBusinessMemberships(): Promise<BusinessMembership[]> {
  const envelope = await apiClient.get(businessPaths.memberships, (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []) as BusinessMembership[]
}

export async function listBusinessApplications(params?: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${businessPaths.applications}${buildQuery({
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
    (json) => (Array.isArray(json) ? json : []),
  )
  return (envelope.data ?? []) as Record<string, unknown>[]
}

export async function getBusinessDashboard(businessId: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.get(businessPaths.business(businessId), (json) =>
    json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function listBusinessAppointments(
  businessId: string,
  params?: { status?: string; from?: string; to?: string },
): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${businessPaths.appointments(businessId)}${buildQuery({
      status: params?.status,
      from: params?.from,
      to: params?.to,
    })}`,
    (json) => (Array.isArray(json) ? json : []),
  )
  return (envelope.data ?? []) as Record<string, unknown>[]
}

export async function listBusinessInvitations(businessId: string): Promise<BusinessInvitation[]> {
  const envelope = await apiClient.get(businessPaths.invitations(businessId), (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []) as BusinessInvitation[]
}

export async function createBusinessInvitation(
  businessId: string,
  input: { email: string; role: InvitableRole; expiresInDays?: number },
): Promise<{ invitation: BusinessInvitation; token: string }> {
  const envelope = await apiClient.post(
    businessPaths.invitations(businessId),
    input,
    (json) => json as { invitation: BusinessInvitation; token: string },
  )
  return envelope.data!
}

export async function revokeBusinessInvitation(
  businessId: string,
  invitationId: string,
): Promise<BusinessInvitation> {
  const envelope = await apiClient.delete(
    businessPaths.invitation(businessId, invitationId),
    (json) => json as BusinessInvitation,
  )
  return envelope.data!
}

export async function acceptBusinessInvitation(token: string): Promise<{
  invitationId: string
  membershipId: string
  businessId: string
  role: string
}> {
  const envelope = await apiClient.post(
    businessPaths.invitationAccept(token),
    {},
    (json) =>
      json as {
        invitationId: string
        membershipId: string
        businessId: string
        role: string
      },
  )
  return envelope.data!
}
