import { apiClient, buildQuery } from './client'
import { adminPaths } from './paths'

export async function listAdminApplications(params?: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${adminPaths.applications}${buildQuery({
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
    (json) => (Array.isArray(json) ? json : []),
  )
  return (envelope.data ?? []) as Record<string, unknown>[]
}

export async function listAdminDisputes(params?: { status?: string }): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${adminPaths.disputes}${buildQuery({ status: params?.status })}`,
    (json) => (Array.isArray(json) ? json : []),
  )
  return (envelope.data ?? []) as Record<string, unknown>[]
}

export async function listAdminReviews(params?: { status?: string }): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${adminPaths.reviews}${buildQuery({ status: params?.status })}`,
    (json) => (Array.isArray(json) ? json : []),
  )
  return (envelope.data ?? []) as Record<string, unknown>[]
}
