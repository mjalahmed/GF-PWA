export type MapDestination = {
  latitude?: number | null
  longitude?: number | null
  addressLine?: string | null
  label?: string | null
}

function hasCoords(d: MapDestination): d is MapDestination & { latitude: number; longitude: number } {
  return (
    typeof d.latitude === 'number' &&
    Number.isFinite(d.latitude) &&
    typeof d.longitude === 'number' &&
    Number.isFinite(d.longitude)
  )
}

function query(d: MapDestination): string {
  if (hasCoords(d)) return `${d.latitude},${d.longitude}`
  return encodeURIComponent([d.addressLine, d.label].filter(Boolean).join(', ') || 'Bahrain')
}

export function googleMapsDirectionsUrl(d: MapDestination): string {
  if (hasCoords(d)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${d.latitude},${d.longitude}`
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${query(d)}`
}

export function appleMapsDirectionsUrl(d: MapDestination): string {
  if (hasCoords(d)) {
    const q = d.label ? encodeURIComponent(d.label) : ''
    return `https://maps.apple.com/?daddr=${d.latitude},${d.longitude}${q ? `&q=${q}` : ''}`
  }
  return `https://maps.apple.com/?daddr=${query(d)}`
}

export function wazeDirectionsUrl(d: MapDestination): string {
  if (hasCoords(d)) {
    return `https://waze.com/ul?ll=${d.latitude},${d.longitude}&navigate=yes`
  }
  return `https://waze.com/ul?q=${query(d)}&navigate=yes`
}

export function geoUri(d: MapDestination): string {
  if (hasCoords(d)) {
    const label = d.label ? encodeURIComponent(d.label) : ''
    return label ? `geo:${d.latitude},${d.longitude}?q=${d.latitude},${d.longitude}(${label})` : `geo:${d.latitude},${d.longitude}`
  }
  return `geo:0,0?q=${query(d)}`
}

export type DirectionsOption = {
  id: 'google' | 'apple' | 'waze' | 'system'
  label: string
  href: string
}

export function directionsOptions(d: MapDestination): DirectionsOption[] {
  return [
    { id: 'google', label: 'Google Maps', href: googleMapsDirectionsUrl(d) },
    { id: 'apple', label: 'Apple Maps', href: appleMapsDirectionsUrl(d) },
    { id: 'waze', label: 'Waze', href: wazeDirectionsUrl(d) },
    { id: 'system', label: 'Open in Maps', href: geoUri(d) },
  ]
}
