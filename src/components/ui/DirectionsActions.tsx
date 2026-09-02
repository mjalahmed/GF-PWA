import { useState } from 'react'
import { directionsOptions, type MapDestination } from '../../lib/mapsLinks'
import { Button } from './Button'

type Props = {
  destination: MapDestination
  className?: string
}

export function DirectionsActions({ destination, className }: Props) {
  const [open, setOpen] = useState(false)
  const options = directionsOptions(destination)
  const canNavigate = Boolean(
    (destination.latitude != null && destination.longitude != null) || destination.addressLine,
  )

  if (!canNavigate) return null

  return (
    <div className={className}>
      <Button type="button" variant="secondary" className="w-full" onClick={() => setOpen((v) => !v)}>
        Get directions
      </Button>
      {open && (
        <ul className="mt-2 space-y-1 rounded-xl border border-border bg-surface p-2">
          {options.map((opt) => (
            <li key={opt.id}>
              <a
                href={opt.href}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary-light"
                onClick={() => setOpen(false)}
              >
                {opt.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
