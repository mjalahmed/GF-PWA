import type { Vehicle } from '../../types/discovery'
import { mapVehicle } from '../../lib/mappers'
import { apiClient } from './client'

export async function listVehicles(): Promise<Vehicle[]> {
  const envelope = await apiClient.get('/v1/vehicles', (json) => (Array.isArray(json) ? json : []))
  return (envelope.data ?? []).map((item) => mapVehicle(item as Record<string, unknown>))
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const envelope = await apiClient.get(`/v1/vehicles/${id}`, (json) => json as Record<string, unknown>)
  return mapVehicle(envelope.data!)
}

export async function createVehicle(body: Record<string, unknown>): Promise<Vehicle> {
  const envelope = await apiClient.post('/v1/vehicles', body, (json) => json as Record<string, unknown>)
  return mapVehicle(envelope.data!)
}

export async function updateVehicle(id: string, body: Record<string, unknown>): Promise<Vehicle> {
  const envelope = await apiClient.patch(`/v1/vehicles/${id}`, body, (json) => json as Record<string, unknown>)
  return mapVehicle(envelope.data!)
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiClient.delete(`/v1/vehicles/${id}`, () => ({}))
}

export async function makeVehicleDefault(id: string): Promise<void> {
  await apiClient.post(`/v1/vehicles/${id}/make-default`, {}, () => ({}))
}
