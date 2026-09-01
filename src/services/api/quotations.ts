import type { PaginatedResult } from '../../types/api'
import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listQuotations(params?: {
  status?: string
  businessId?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedResult<Record<string, unknown>>> {
  const envelope = await apiClient.get(
    `${customerPaths.quotations}${buildQuery({
      status: params?.status,
      businessId: params?.businessId,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return { items: (envelope.data ?? []) as Record<string, unknown>[], pagination: envelope.meta?.pagination }
}

export async function getQuotation(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.get(customerPaths.quotation(id), (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function viewQuotation(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    customerPaths.quotationAction(id, 'view'),
    {},
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function acceptQuotation(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    customerPaths.quotationAction(id, 'accept'),
    {},
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function rejectQuotation(id: string, reason?: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    customerPaths.quotationAction(id, 'reject'),
    { reason: reason ?? null },
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}
