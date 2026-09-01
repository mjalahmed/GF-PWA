import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listVehicles(): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(customerPaths.vehicles, (json) => (Array.isArray(json) ? json : []))
  return (envelope.data ?? []) as Record<string, unknown>[]
}

export async function getVehicle(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.get(customerPaths.vehicle(id), (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function createVehicle(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(customerPaths.vehicles, body, (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function updateVehicle(id: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const envelope = await apiClient.patch(customerPaths.vehicle(id), body, (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiClient.delete(customerPaths.vehicle(id), () => ({}))
}

export async function makeVehicleDefault(id: string): Promise<void> {
  await apiClient.post(customerPaths.vehicleDefault(id), {}, () => ({}))
}
