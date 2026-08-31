import type { Invoice, Payment } from '../../types/commerce'
import { mapInvoice, mapPayment } from '../../lib/mappers'
import { apiClient, buildQuery } from './client'

export async function listInvoices(params?: {
  status?: string
  from?: string
  to?: string
  businessId?: string
}): Promise<Invoice[]> {
  const envelope = await apiClient.get(
    `/v1/invoices${buildQuery({
      status: params?.status,
      from: params?.from,
      to: params?.to,
      businessId: params?.businessId,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return (envelope.data ?? []).map((item) => mapInvoice(item as Record<string, unknown>))
}

export async function getInvoice(id: string): Promise<Invoice> {
  const envelope = await apiClient.get(`/v1/invoices/${id}`, (json) => json as Record<string, unknown>)
  return mapInvoice(envelope.data!)
}

export async function viewInvoice(id: string, note?: string): Promise<Invoice> {
  const envelope = await apiClient.post(
    `/v1/invoices/${id}/view`,
    { note: note ?? null },
    (json) => json as Record<string, unknown>,
  )
  return mapInvoice(envelope.data!)
}

export async function approveInvoice(id: string, note?: string): Promise<Invoice> {
  const envelope = await apiClient.post(
    `/v1/invoices/${id}/approve`,
    { note: note ?? null },
    (json) => json as Record<string, unknown>,
  )
  return mapInvoice(envelope.data!)
}

export async function listInvoicePayments(invoiceId: string): Promise<Payment[]> {
  const envelope = await apiClient.get(`/v1/invoices/${invoiceId}/payments`, (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []).map((item) => mapPayment(item as Record<string, unknown>))
}
