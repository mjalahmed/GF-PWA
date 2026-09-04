import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Appointment } from '../../types/appointments'
import { StatusBadge } from '../ui/StatusBadge'

const ACTIVE_STATUSES = new Set([
  'in_progress',
  'customer_arrived',
  'waiting',
  'waiting_for_parts',
  'waiting_for_customer',
  'waiting_parts',
  'waiting_customer',
  'awaiting_customer',
  'awaiting_business',
  'quote_pending',
  'quote_accepted',
  'ready_for_pickup',
])

export function isActiveServiceAppointment(status: string): boolean {
  return ACTIVE_STATUSES.has(status) || status.startsWith('waiting')
}

function elapsedLabel(startedAt: string, now: number): string {
  const ms = Math.max(0, now - new Date(startedAt).getTime())
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return 'Started just now'
  if (minutes === 1) return 'Started 1 minute ago'
  if (minutes < 60) return `Started ${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (hours === 1 && rem === 0) return 'Started 1 hour ago'
  if (rem === 0) return `Started ${hours} hours ago`
  return `Started ${hours}h ${rem}m ago`
}

type Props = {
  appointment: Appointment
  vehicleLabel?: string
}

export function ActiveServiceCard({ appointment, vehicleLabel }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const startedAt =
    appointment.startedAt ||
    appointment.arrivedAt ||
    appointment.statusHistory?.find((h) =>
      ['in_progress', 'customer_arrived', 'started'].includes(h.status),
    )?.changedAt ||
    appointment.scheduledStart

  const expectedMinutes = appointment.services.reduce(
    (sum, s) => sum + (s.estimatedDurationMinutes || 0),
    0,
  )
  const elapsedMinutes = startedAt
    ? Math.floor(Math.max(0, now - new Date(startedAt).getTime()) / 60_000)
    : 0
  const exceeded = expectedMinutes > 0 && elapsedMinutes > expectedMinutes

  return (
    <Link
      to={`/appointments/${appointment.id}`}
      className="mt-4 block rounded-2xl border-2 border-primary bg-primary-light/30 p-4 no-underline"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Live service</p>
      <div className="mt-1 flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-text-primary">Your car is being serviced</h3>
        <StatusBadge status={appointment.status} />
      </div>
      <dl className="mt-3 space-y-1 text-sm text-text-secondary">
        {appointment.businessName && (
          <div>
            <dt className="inline text-text-muted">Garage: </dt>
            <dd className="inline font-medium text-text-primary">{appointment.businessName}</dd>
          </div>
        )}
        {vehicleLabel && (
          <div>
            <dt className="inline text-text-muted">Vehicle: </dt>
            <dd className="inline font-medium text-text-primary">{vehicleLabel}</dd>
          </div>
        )}
        {startedAt && (
          <div>
            <dt className="sr-only">Elapsed</dt>
            <dd className="font-medium text-text-primary">{elapsedLabel(startedAt, now)}</dd>
          </div>
        )}
      </dl>
      {exceeded && (
        <p className="mt-3 text-sm text-warning">
          Expected about {expectedMinutes} minutes — still in progress (not auto-completed).
        </p>
      )}
    </Link>
  )
}
