import { useCallback, useState } from 'react'

export type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'granted'; latitude: number; longitude: number }
  | { status: 'denied'; message: string }
  | { status: 'unavailable'; message: string }

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'unavailable', message: 'Geolocation is not supported on this device.' })
      return
    }
    setState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          status: 'granted',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState({ status: 'denied', message: 'Location permission was denied.' })
        } else {
          setState({ status: 'unavailable', message: err.message || 'Could not get your location.' })
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    )
  }, [])

  return { state, requestLocation }
}
