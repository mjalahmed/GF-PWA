import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { fetchGarageSetupChecklist } from '../../lib/fetchGarageSetup'
import {
  listBusinessAppointments,
  listBusinessInvoices,
  listMyBusinessMemberships,
} from '../../services/api/business'
import { listNotifications } from '../../services/api/notifications'

function startOfTodayIso() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function endOfTodayIso() {
  const d = new Date()
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

function isSameDay(iso: string | undefined, day: Date) {
  if (!iso) return false
  const d = new Date(iso)
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  )
}

function GarageDashboard({
  businessId,
  displayName,
}: {
  businessId: string
  displayName: string
}) {
  const today = useMemo(() => new Date(), [])
  const from = startOfTodayIso()
  const to = endOfTodayIso()

  const setupQuery = useQuery({
    queryKey: ['garage-setup', businessId],
    queryFn: () => fetchGarageSetupChecklist(businessId),
  })

  const appointmentsQuery = useQuery({
    queryKey: ['business-appointments', businessId, 'dashboard', from],
    queryFn: () => listBusinessAppointments(businessId, { from, to }),
  })

  const allApptsQuery = useQuery({
    queryKey: ['business-appointments', businessId, 'active'],
    queryFn: () => listBusinessAppointments(businessId),
  })

  const invoicesQuery = useQuery({
    queryKey: ['business-invoices', businessId, 'outstanding'],
    queryFn: () => listBusinessInvoices(businessId),
  })

  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'business-dash'],
    queryFn: () => listNotifications(true),
  })

  const todayAppts = useMemo(() => {
    const list = appointmentsQuery.data ?? []
    return list.filter((a) => isSameDay(String(a.scheduledStart ?? a.scheduled_start ?? ''), today))
  }, [appointmentsQuery.data, today])

  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of todayAppts) {
      const s = String(a.status ?? 'unknown')
      counts[s] = (counts[s] ?? 0) + 1
    }
    return counts
  }, [todayAppts])

  const inService = (allApptsQuery.data ?? []).filter((a) =>
    ['in_progress', 'waiting', 'waiting_for_parts', 'waiting_for_customer', 'customer_arrived'].includes(
      String(a.status),
    ),
  ).length

  const readyPickup = (allApptsQuery.data ?? []).filter(
    (a) => String(a.status) === 'ready_for_pickup',
  ).length

  const outstanding = (invoicesQuery.data ?? []).filter((inv) => {
    const status = String(inv.status ?? '')
    return ['issued', 'viewed', 'customer_approved', 'partially_paid', 'overdue', 'awaiting_payment'].includes(
      status,
    )
  }).length

  const alerts = (notificationsQuery.data ?? []).slice(0, 5)
  const incomplete = setupQuery.data ? !setupQuery.data.complete : false

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{displayName}</h3>
          <p className="text-xs text-text-muted">Today’s snapshot</p>
        </div>
        {incomplete && (
          <Link
            to={`/business/garages/${businessId}/setup`}
            className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning"
          >
            Setup required
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-2xl font-semibold">{todayAppts.length}</p>
          <p className="text-xs text-text-muted">Today</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-2xl font-semibold">{inService}</p>
          <p className="text-xs text-text-muted">In service</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-2xl font-semibold">{readyPickup}</p>
          <p className="text-xs text-text-muted">Ready for pickup</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-2xl font-semibold">{outstanding}</p>
          <p className="text-xs text-text-muted">Outstanding invoices</p>
        </div>
      </div>

      {Object.keys(byStatus).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(byStatus).map(([status, count]) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
            >
              <StatusBadge status={status} />
              <span className="font-semibold">{count}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          to={`/business/appointments?businessId=${encodeURIComponent(businessId)}`}
          className="rounded-lg border border-border px-3 py-2 text-primary"
        >
          Appointments
        </Link>
        <Link
          to={`/business/invoices?businessId=${encodeURIComponent(businessId)}`}
          className="rounded-lg border border-border px-3 py-2 text-primary"
        >
          Invoices
        </Link>
        <Link
          to={`/business/quotations?businessId=${encodeURIComponent(businessId)}`}
          className="rounded-lg border border-border px-3 py-2 text-primary"
        >
          Quotations
        </Link>
        <Link
          to={`/business/garages/${businessId}`}
          className="rounded-lg border border-border px-3 py-2 text-primary"
        >
          Garage
        </Link>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Alerts</h4>
          <ul className="space-y-1">
            {alerts.map((n) => (
              <li key={n.id} className="rounded-lg bg-primary-light/20 px-3 py-2 text-sm">
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-text-muted line-clamp-1">{n.body}</p>
              </li>
            ))}
          </ul>
          <Link to="/notifications" className="text-xs text-primary">
            All notifications →
          </Link>
        </div>
      )}
    </div>
  )
}

export function BusinessDashboardPage() {
  const membershipsQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })

  if (membershipsQuery.isLoading) return <Spinner />

  const memberships = membershipsQuery.data ?? []
  if (memberships.length === 0) {
    return <Navigate to="/business/applications" replace />
  }

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <h2 className="text-xl font-semibold">Garage dashboard</h2>
      {membershipsQuery.isError && (
        <p className="text-sm text-error">
          {membershipsQuery.error instanceof Error
            ? membershipsQuery.error.message
            : 'Failed to load memberships'}
        </p>
      )}
      {memberships.map((m) => (
        <GarageDashboard
          key={m.membershipId}
          businessId={m.businessId}
          displayName={m.business.displayName}
        />
      ))}
    </section>
  )
}
