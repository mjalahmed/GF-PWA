import type { Quotation } from '../../types/commerce'
import { mapQuotation } from '../../lib/mappers'
import { mapList } from '../../lib/map'
import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listQuotations(params?: {
  status?: string
  businessId?: string
  from?: string
  to?: string
}): Promise<Quotation[]> {
  const envelope = await apiClient.get(
    `${customerPaths.quotations}${buildQuery({
      status: params?.status,
      businessId: params?.businessId,
      from: params?.from,
      to: params?.to,
    })}`,
    (json) => json,
  )
  return mapList(envelope.data, mapQuotation)
}

export async function getQuotation(id: string): Promise<Quotation> {
  const envelope = await apiClient.get(customerPaths.quotation(id), (json) => json as Record<string, unknown>)
  return mapQuotation(envelope.data!)
}

export async function viewQuotation(id: string): Promise<Quotation> {
  const envelope = await apiClient.post(
    customerPaths.quotationAction(id, 'view'),
    {},
    (json) => json as Record<string, unknown>,
  )
  return mapQuotation(envelope.data!)
}

export async function acceptQuotation(id: string): Promise<Quotation> {
  const envelope = await apiClient.post(
    customerPaths.quotationAction(id, 'accept'),
    {},
    (json) => json as Record<string, unknown>,
  )
  return mapQuotation(envelope.data!)
}

export async function rejectQuotation(id: string, reason?: string): Promise<Quotation> {
  const envelope = await apiClient.post(
    customerPaths.quotationAction(id, 'reject'),
    { reason: reason ?? null },
    (json) => json as Record<string, unknown>,
  )
  return mapQuotation(envelope.data!)
}
