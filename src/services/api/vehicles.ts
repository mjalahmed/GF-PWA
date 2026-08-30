import type { Vehicle } from '../../types/discovery'
import { apiClient } from './client'

function mapVehicle(raw: Record<string, unknown>): Vehicle {
  return {
    id: String(raw.id),
    makeId: String(raw.makeId ?? raw.make_id),
    modelId: String(raw.modelId ?? raw.model_id),
    year: Number(raw.year),
    plateNumber: (raw.plateNumber ?? raw.plate_number) as string | undefined,
    isDefault: Boolean(raw.isDefault ?? raw.is_default),
    displayLabel: (raw.displayLabel ?? raw.display_label) as string | undefined,
  }
}

export async function listVehicles(): Promise<Vehicle[]> {
  const envelope = await apiClient.get('/v1/vehicles', (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []).map((item) => mapVehicle(item as Record<string, unknown>))
}
