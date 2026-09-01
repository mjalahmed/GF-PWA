import type { PaginatedResult } from '../../types/api'
import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listInvoices(params?: {
  status?: string
  businessId?: string
  page?: number
  pageSize?: number
}): Promise<PaginatedResult<Record<string, unknown>>> {
  const envelope = await apiClient.get(
    `${customerPaths.invoices}${buildQuery({
      status: params?.status,
      businessId: params?.businessId,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return { items: (envelope.data ?? []) as Record<string, unknown>[], pagination: envelope.meta?.pagination }
}

export async function getInvoice(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.get(customerPaths.invoice(id), (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function viewInvoice(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    customerPaths.invoiceAction(id, 'view'),
    {},
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function approveInvoice(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    customerPaths.invoiceAction(id, 'approve'),
    {},
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function listInvoicePayments(invoiceId: string): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(customerPaths.invoicePayments(invoiceId), (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []) as Record<string, unknown>[]
}
