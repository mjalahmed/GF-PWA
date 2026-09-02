import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from './Button'

const DEFAULT_CENTER: [number, number] = [26.2235, 50.5876] // Manama

type Props = {
  latitude: number | null
  longitude: number | null
  onChange: (coords: { latitude: number; longitude: number }) => void
}

export function LocationPicker({ latitude, longitude, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.CircleMarker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const center: [number, number] =
      latitude != null && longitude != null ? [latitude, longitude] : DEFAULT_CENTER

    const map = L.map(mapRef.current).setView(center, latitude != null ? 15 : 11)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.circleMarker(center, {
      radius: 10,
      color: '#0f766e',
      fillColor: '#14b8a6',
      fillOpacity: 0.9,
      weight: 2,
    }).addTo(map)
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onChangeRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng })
    })

    mapInstance.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
    }
    // Initial center only — remount when parent remounts the picker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (latitude == null || longitude == null || !mapInstance.current || !markerRef.current) return
    const next = L.latLng(latitude, longitude)
    markerRef.current.setLatLng(next)
    mapInstance.current.setView(next, Math.max(mapInstance.current.getZoom(), 14))
  }, [latitude, longitude])

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChangeRef.current({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-text-primary">Pin location</p>
        <Button type="button" variant="secondary" onClick={useMyLocation}>
          Use my location
        </Button>
      </div>
      <div ref={mapRef} className="h-56 w-full overflow-hidden rounded-xl border border-border" />
      <p className="text-xs text-text-muted">
        Tap the map or drag the pin. Lat/lng:{' '}
        {latitude != null && longitude != null
          ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          : 'not set'}
      </p>
    </div>
  )
}
