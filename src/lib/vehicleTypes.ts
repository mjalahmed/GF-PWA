/** Body / vehicle type codes sent as vehicleType (or bodyType) to the API. */
export const VEHICLE_TYPE_OPTIONS = [
  'sedan',
  'hatchback',
  'suv',
  'crossover',
  'coupe',
  'convertible',
  'wagon',
  'van',
  'minivan',
  'pickup',
  'truck',
  'motorcycle',
  'bus',
  'other',
] as const

export type VehicleTypeCode = (typeof VEHICLE_TYPE_OPTIONS)[number]

export function vehicleTypeLabelKey(code: string): string {
  return `vehicles.type.${code}`
}
