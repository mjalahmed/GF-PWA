import { apiClient } from './client'
import { customerPaths, platformPaths } from './paths'

export type Announcement = {
  id: string
  slug: string
  title: string
  summary: string
  body: string | null
  category: string
  icon: string | null
}

export type ServiceHistoryItem = {
  id: string
  type: 'appointment' | 'quotation' | 'invoice' | 'payment' | string
  status: string
  title: string
  occurredAt: string
  businessName: string | null
  amount: number | null
  currency: string | null
  appointmentId?: string | null
  invoiceId?: string | null
  quotationId?: string | null
  media?: Array<{ id?: string; storagePath: string; phase?: string; caption?: string | null }>
  payments?: Array<{ id?: string; amount?: number; status?: string; method?: string; paidAt?: string }>
}

export type RepairPhoto = {
  id: string
  appointmentId: string
  phase: 'before' | 'during' | 'after'
  storagePath: string
  caption: string | null
  sortOrder: number
  createdAt: string
}

export async function listAnnouncements(): Promise<Announcement[]> {
  try {
    const envelope = await apiClient.get(customerPaths.announcements, (json) =>
      Array.isArray(json) ? (json as Record<string, unknown>[]) : [],
    )
    return (envelope.data ?? []).map((raw) => ({
      id: String(raw.id),
      slug: String(raw.slug),
      title: String(raw.title),
      summary: String(raw.summary),
      body: (raw.body as string | null) ?? null,
      category: String(raw.category),
      icon: (raw.icon as string | null) ?? null,
    }))
  } catch {
    // Table may be missing until migration is applied — home page still works
    return []
  }
}

function mapHistoryItem(raw: Record<string, unknown>): ServiceHistoryItem {
  const mediaRaw = raw.media ?? raw.photos
  const paymentsRaw = raw.payments
  return {
    id: String(raw.id),
    type: String(raw.type ?? 'appointment'),
    status: String(raw.status ?? ''),
    title: String(raw.title ?? raw.businessName ?? raw.business_name ?? ''),
    occurredAt: String(raw.occurredAt ?? raw.occurred_at ?? raw.createdAt ?? raw.created_at ?? ''),
    businessName: (raw.businessName ?? raw.business_name ?? null) as string | null,
    amount: raw.amount != null ? Number(raw.amount) : raw.grandTotal != null ? Number(raw.grandTotal) : null,
    currency: (raw.currency as string | null) ?? null,
    appointmentId: (raw.appointmentId ?? raw.appointment_id ?? (raw.type === 'appointment' ? raw.id : null)) as
      | string
      | null,
    invoiceId: (raw.invoiceId ?? raw.invoice_id ?? (raw.type === 'invoice' ? raw.id : null)) as
      | string
      | null,
    quotationId: (raw.quotationId ?? raw.quotation_id ?? (raw.type === 'quotation' ? raw.id : null)) as
      | string
      | null,
    media: Array.isArray(mediaRaw)
      ? (mediaRaw as Record<string, unknown>[]).map((m) => ({
          id: m.id != null ? String(m.id) : undefined,
          storagePath: String(m.storagePath ?? m.storage_path ?? ''),
          phase: m.phase as string | undefined,
          caption: (m.caption as string | null) ?? null,
        }))
      : undefined,
    payments: Array.isArray(paymentsRaw)
      ? (paymentsRaw as Record<string, unknown>[]).map((p) => ({
          id: p.id != null ? String(p.id) : undefined,
          amount: p.amount != null ? Number(p.amount) : undefined,
          status: p.status != null ? String(p.status) : undefined,
          method: p.method != null ? String(p.method) : undefined,
          paidAt: (p.paidAt ?? p.paid_at ?? p.confirmedAt ?? p.confirmed_at) as string | undefined,
        }))
      : undefined,
  }
}

export async function getVehicleServiceHistory(vehicleId: string): Promise<ServiceHistoryItem[]> {
  const envelope = await apiClient.get(customerPaths.vehicleServiceHistory(vehicleId), (json) =>
    json as Record<string, unknown>[],
  )
  return (envelope.data ?? []).map(mapHistoryItem)
}

/** Prefer history-detail when available; fall back to service-history. */
export async function getVehicleHistoryDetail(vehicleId: string): Promise<ServiceHistoryItem[]> {
  try {
    const envelope = await apiClient.get(customerPaths.vehicleHistoryDetail(vehicleId), (json) => {
      if (Array.isArray(json)) return json as Record<string, unknown>[]
      const obj = json as Record<string, unknown>
      if (Array.isArray(obj.items)) return obj.items as Record<string, unknown>[]
      if (Array.isArray(obj.history)) return obj.history as Record<string, unknown>[]
      return []
    })
    const items = (envelope.data ?? []).map(mapHistoryItem)
    if (items.length > 0) return items
  } catch {
    // Endpoint may not exist yet
  }
  return getVehicleServiceHistory(vehicleId)
}

export async function createQuoteRequest(body: {
  businessId: string
  branchId?: string
  vehicleId?: string
  serviceId?: string
  description: string
  imagePaths?: string[]
}): Promise<{ id: string }> {
  const envelope = await apiClient.post(customerPaths.quoteRequests, body, (json) =>
    json as Record<string, unknown>,
  )
  return { id: String(envelope.data?.id) }
}

export async function createEmergencyRequest(body: {
  requestType: 'tow_nearest' | 'tow_garage' | 'roadside_assistance'
  businessId?: string
  vehicleId?: string
  latitude?: number
  longitude?: number
  addressText?: string
  notes?: string
}): Promise<{ id: string }> {
  const envelope = await apiClient.post(customerPaths.emergencyRequests, body, (json) =>
    json as Record<string, unknown>,
  )
  return { id: String(envelope.data?.id) }
}

export async function getAppointmentMedia(appointmentId: string): Promise<RepairPhoto[]> {
  const envelope = await apiClient.get(customerPaths.appointmentMedia(appointmentId), (json) =>
    json as Record<string, unknown>[],
  )
  return (envelope.data ?? []).map((raw) => ({
    id: String(raw.id),
    appointmentId: String(raw.appointmentId ?? raw.appointment_id),
    phase: raw.phase as RepairPhoto['phase'],
    storagePath: String(raw.storagePath ?? raw.storage_path),
    caption: (raw.caption as string | null) ?? null,
    sortOrder: Number(raw.sortOrder ?? raw.sort_order ?? 0),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
  }))
}

export { platformPaths }
