import type { Vehicle } from '../../types/discovery'
import { mapVehicle } from '../../lib/mappers'
import { mapList } from '../../lib/map'
import { apiClient } from './client'
import { customerPaths } from './paths'

export async function listVehicles(): Promise<Vehicle[]> {
  const envelope = await apiClient.get(customerPaths.vehicles, (json) => json)
  return mapList(envelope.data, mapVehicle)
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const envelope = await apiClient.get(customerPaths.vehicle(id), (json) => json as Record<string, unknown>)
  return mapVehicle(envelope.data!)
}

function toVehicleWriteBody(body: {
  makeId?: string
  modelId?: string
  year?: number
  plateNumber?: string
  registrationNumber?: string | null
  vin?: string
  color?: string
  trim?: string
  mileage?: number
  imagePath?: string
  vehicleType?: string
  bodyType?: string
  fuelType?: string
  transmission?: string
}): Record<string, unknown> {
  const { plateNumber, registrationNumber, vehicleType, bodyType, ...rest } = body
  const payload: Record<string, unknown> = { ...rest }
  const plate = registrationNumber !== undefined ? registrationNumber : plateNumber
  if (plate !== undefined) payload.registrationNumber = plate || null
  const type = vehicleType ?? bodyType
  if (type !== undefined) {
    payload.vehicleType = type || null
    payload.bodyType = type || null
  }
  return payload
}

export async function createVehicle(body: {
  makeId: string
  modelId: string
  year: number
  plateNumber?: string
  registrationNumber?: string | null
  vin?: string
  color?: string
  trim?: string
  mileage?: number
  imagePath?: string
  vehicleType?: string
  bodyType?: string
  fuelType?: string
  transmission?: string
}): Promise<Vehicle> {
  const envelope = await apiClient.post(
    customerPaths.vehicles,
    toVehicleWriteBody(body),
    (json) => json as Record<string, unknown>,
  )
  return mapVehicle(envelope.data!)
}

export async function updateVehicle(
  id: string,
  body: Partial<{
    makeId: string
    modelId: string
    year: number
    plateNumber: string
    registrationNumber: string | null
    vin: string
    color: string
    trim: string
    mileage: number
    imagePath: string
    vehicleType: string
    bodyType: string
    fuelType: string
    transmission: string
  }>,
): Promise<Vehicle> {
  const envelope = await apiClient.patch(
    customerPaths.vehicle(id),
    toVehicleWriteBody(body),
    (json) => json as Record<string, unknown>,
  )
  return mapVehicle(envelope.data!)
}

export async function deleteVehicle(id: string): Promise<void> {
  await apiClient.delete(customerPaths.vehicle(id), () => ({}))
}

export async function makeVehicleDefault(id: string): Promise<void> {
  await apiClient.post(customerPaths.vehicleDefault(id), {}, () => ({}))
}

export async function listPendingVehicleConfirmations(): Promise<Vehicle[]> {
  const envelope = await apiClient.get(customerPaths.vehiclesPendingConfirmation, (json) => json)
  return mapList(envelope.data, mapVehicle)
}

export async function confirmVehicle(id: string): Promise<void> {
  await apiClient.post(customerPaths.vehicleConfirm(id), {}, () => ({}), crypto.randomUUID())
}

export async function rejectVehicle(id: string): Promise<void> {
  await apiClient.post(customerPaths.vehicleReject(id), {}, () => ({}), crypto.randomUUID())
}
