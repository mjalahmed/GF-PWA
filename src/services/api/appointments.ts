import type { Appointment, AppointmentSlotsResult } from '../../types/appointments'
import { mapAppointment, mapAppointmentSlots } from '../../lib/mappers'
import { apiClient, buildQuery } from './client'

export async function listAppointments(params?: {
  status?: string
  from?: string
  to?: string
  businessId?: string
  branchId?: string
}): Promise<Appointment[]> {
  const envelope = await apiClient.get(
    `/v1/appointments${buildQuery({
      status: params?.status,
      from: params?.from,
      to: params?.to,
      businessId: params?.businessId,
      branchId: params?.branchId,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return (envelope.data ?? []).map((item) => mapAppointment(item as Record<string, unknown>))
}

export async function getAppointment(id: string): Promise<Appointment> {
  const envelope = await apiClient.get(`/v1/appointments/${id}`, (json) => json as Record<string, unknown>)
  return mapAppointment(envelope.data!)
}

export async function createAppointment(body: {
  businessId: string
  branchId: string
  serviceId: string
  scheduledStart: string
  vehicleId?: string
  customerNotes?: string
}): Promise<Appointment> {
  const envelope = await apiClient.post('/v1/appointments', body, (json) => json as Record<string, unknown>)
  return mapAppointment(envelope.data!)
}

export async function listAppointmentSlots(params: {
  businessId: string
  branchId: string
  date: string
  serviceId?: string
}): Promise<AppointmentSlotsResult> {
  const envelope = await apiClient.get(
    `/v1/businesses/${params.businessId}/branches/${params.branchId}/appointment-slots${buildQuery({
      date: params.date,
      serviceId: params.serviceId,
    })}`,
    (json) => json as Record<string, unknown>,
  )
  return mapAppointmentSlots(envelope.data!)
}

export async function cancelAppointment(id: string, reason?: string): Promise<Appointment> {
  const envelope = await apiClient.post(
    `/v1/appointments/${id}/cancel`,
    { reason: reason ?? null },
    (json) => json as Record<string, unknown>,
  )
  return mapAppointment(envelope.data!)
}
