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
  type: 'appointment' | 'quotation' | 'invoice'
  status: string
  title: string
  occurredAt: string
  businessName: string | null
  amount: number | null
  currency: string | null
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
  const envelope = await apiClient.get(customerPaths.announcements, (json) =>
    json as Record<string, unknown>[],
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
}

export async function getVehicleServiceHistory(vehicleId: string): Promise<ServiceHistoryItem[]> {
  const envelope = await apiClient.get(customerPaths.vehicleServiceHistory(vehicleId), (json) =>
    json as Record<string, unknown>[],
  )
  return (envelope.data ?? []).map((raw) => ({
    id: String(raw.id),
    type: raw.type as ServiceHistoryItem['type'],
    status: String(raw.status),
    title: String(raw.title),
    occurredAt: String(raw.occurredAt ?? raw.occurred_at ?? ''),
    businessName: (raw.businessName ?? raw.business_name ?? null) as string | null,
    amount: raw.amount != null ? Number(raw.amount) : null,
    currency: (raw.currency as string | null) ?? null,
  }))
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
