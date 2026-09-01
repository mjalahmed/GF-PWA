import { apiClient, buildQuery } from './client'
import { businessPaths } from './paths'

export async function listMyBusinessMemberships(): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(businessPaths.memberships, (json) => (Array.isArray(json) ? json : []))
  return (envelope.data ?? []) as Record<string, unknown>[]
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
  const envelope = await apiClient.get(businessPaths.business(businessId), (json) => json as Record<string, unknown>)
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
