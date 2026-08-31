import type { Quotation } from '../../types/commerce'
import { mapQuotation } from '../../lib/mappers'
import { apiClient, buildQuery } from './client'

export async function listQuotations(params?: {
  status?: string
  from?: string
  to?: string
  businessId?: string
}): Promise<Quotation[]> {
  const envelope = await apiClient.get(
    `/v1/quotations${buildQuery({
      status: params?.status,
      from: params?.from,
      to: params?.to,
      businessId: params?.businessId,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return (envelope.data ?? []).map((item) => mapQuotation(item as Record<string, unknown>))
}

export async function getQuotation(id: string): Promise<Quotation> {
  const envelope = await apiClient.get(`/v1/quotations/${id}`, (json) => json as Record<string, unknown>)
  return mapQuotation(envelope.data!)
}

export async function viewQuotation(id: string, note?: string): Promise<Quotation> {
  const envelope = await apiClient.post(
    `/v1/quotations/${id}/view`,
    { note: note ?? null },
    (json) => json as Record<string, unknown>,
  )
  return mapQuotation(envelope.data!)
}

export async function acceptQuotation(id: string, note?: string): Promise<Quotation> {
  const envelope = await apiClient.post(
    `/v1/quotations/${id}/accept`,
    { note: note ?? null },
    (json) => json as Record<string, unknown>,
  )
  return mapQuotation(envelope.data!)
}

export async function rejectQuotation(id: string, note?: string): Promise<Quotation> {
  const envelope = await apiClient.post(
    `/v1/quotations/${id}/reject`,
    { note: note ?? null },
    (json) => json as Record<string, unknown>,
  )
  return mapQuotation(envelope.data!)
}
