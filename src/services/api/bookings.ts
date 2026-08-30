import type { Appointment } from '../../types/discovery'
import { apiClient, buildQuery } from './client'

function mapAppointment(raw: Record<string, unknown>): Appointment {
  return {
    id: String(raw.id),
    status: String(raw.status),
    scheduledStart: String(raw.scheduledStart ?? raw.scheduled_start),
    scheduledEnd: String(raw.scheduledEnd ?? raw.scheduled_end),
    businessId: String(raw.businessId ?? raw.business_id),
    branchId: String(raw.branchId ?? raw.branch_id),
    businessName: (raw.businessName ?? raw.business_name) as string | undefined,
    branchName: (raw.branchName ?? raw.branch_name) as string | undefined,
  }
}

export async function listAppointments(params?: { status?: string }): Promise<Appointment[]> {
  const envelope = await apiClient.get(
    `/v1/appointments${buildQuery({ status: params?.status })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return (envelope.data ?? []).map((item) => mapAppointment(item as Record<string, unknown>))
}
