import { useCallback, useState } from 'react'

export type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'granted'; latitude: number; longitude: number }
  | { status: 'denied'; messageKey: string }
  | { status: 'unavailable'; messageKey: string }

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ status: 'unavailable', messageKey: 'search.geo.unsupported' })
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
          setState({ status: 'denied', messageKey: 'search.geo.denied' })
        } else {
          setState({ status: 'unavailable', messageKey: 'search.geo.unavailable' })
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    )
  }, [])

  return { state, requestLocation }
}
