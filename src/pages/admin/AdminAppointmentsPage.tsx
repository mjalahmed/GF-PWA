import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { useLocale } from '../../i18n/LocaleProvider'
import { listAdminAppointments } from '../../services/api/admin'

export function AdminAppointmentsPage() {
  const { t, statusLabel } = useLocale()
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const appointmentsQuery = useQuery({
    queryKey: ['admin-appointments', status, from, to],
    queryFn: () =>
      listAdminAppointments({
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        pageSize: 100,
      }),
  })

  if (appointmentsQuery.isLoading) return <Spinner />

  if (appointmentsQuery.isError) {
    return (
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <h2 className="text-xl font-semibold">{t('admin.appointments.title')}</h2>
        <EmptyState
          title={t('admin.appointments.loadError')}
          description={
            appointmentsQuery.error instanceof Error
              ? appointmentsQuery.error.message
              : undefined
          }
        />
      </section>
    )
  }

  const items = appointmentsQuery.data ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">{t('admin.appointments.title')}</h2>
        <p className="text-sm text-text-muted">{t('admin.appointments.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('common.status')}</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t('common.all')}</option>
            <option value="requested">{statusLabel('requested')}</option>
            <option value="confirmed">{statusLabel('confirmed')}</option>
            <option value="in_progress">{statusLabel('in_progress')}</option>
            <option value="completed">{statusLabel('completed')}</option>
            <option value="cancelled_by_business">{statusLabel('cancelled_by_business')}</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('admin.appointments.from')}</span>
          <input
            type="date"
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('admin.appointments.to')}</span>
          <input
            type="date"
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>

      {items.length === 0 && <EmptyState title={t('admin.appointments.empty')} />}

      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id}>
            <Link
              to={`/admin/appointments/${a.id}`}
              className="block rounded-xl border border-border bg-surface p-4 text-sm no-underline"
            >
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-primary">{statusLabel(a.status)}</span>
                <span className="text-xs text-text-muted">
                  {a.scheduledStart ? new Date(a.scheduledStart).toLocaleString() : '—'}
                </span>
              </div>
              <p className="mt-1 font-medium text-text-primary">
                {a.businessName || t('common.garage')}
              </p>
              <p className="text-text-muted">
                {[a.customerName, a.vehicleLabel].filter(Boolean).join(' · ') || a.id.slice(0, 8)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
