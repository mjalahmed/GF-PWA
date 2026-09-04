import type { Invoice, Payment } from '../../types/commerce'
import { mapInvoice, mapPayment } from '../../lib/mappers'
import { mapList } from '../../lib/map'
import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listInvoices(params?: {
  status?: string
  businessId?: string
  from?: string
  to?: string
}): Promise<Invoice[]> {
  const envelope = await apiClient.get(
    `${customerPaths.invoices}${buildQuery({
      status: params?.status,
      businessId: params?.businessId,
      from: params?.from,
      to: params?.to,
    })}`,
    (json) => json,
  )
  return mapList(envelope.data, mapInvoice)
}

export async function getInvoice(id: string): Promise<Invoice> {
  const envelope = await apiClient.get(customerPaths.invoice(id), (json) => json as Record<string, unknown>)
  return mapInvoice(envelope.data!)
}

export async function viewInvoice(id: string): Promise<Invoice> {
  const envelope = await apiClient.post(
    customerPaths.invoiceAction(id, 'view'),
    {},
    (json) => json as Record<string, unknown>,
  )
  return mapInvoice(envelope.data!)
}

export async function approveInvoice(id: string): Promise<Invoice> {
  const envelope = await apiClient.post(
    customerPaths.invoiceAction(id, 'approve'),
    {},
    (json) => json as Record<string, unknown>,
  )
  return mapInvoice(envelope.data!)
}

export async function listInvoicePayments(invoiceId: string): Promise<Payment[]> {
  const envelope = await apiClient.get(customerPaths.invoicePayments(invoiceId), (json) => json)
  return mapList(envelope.data, mapPayment)
}

/** Customer marks BenefitPay transfer as submitted; garage confirms later. */
export async function submitBenefitPayPayment(
  invoiceId: string,
  input?: { amount?: number; note?: string },
): Promise<Payment> {
  const envelope = await apiClient.post(
    customerPaths.invoiceBenefitPay(invoiceId),
    {
      ...(input?.amount != null ? { amount: input.amount } : {}),
      ...(input?.note ? { note: input.note } : {}),
    },
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return mapPayment(envelope.data!)
}
