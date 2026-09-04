import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useLocale } from '../../i18n/LocaleProvider'
import {
  listBusinessAppointments,
  listMyBusinessMemberships,
  transitionAppointment,
} from '../../services/api/business'

const ACTIONS: Record<string, Array<'confirm' | 'reject' | 'cancel' | 'arrive' | 'start' | 'complete' | 'no-show'>> = {
  requested: ['confirm', 'reject'],
  confirmed: ['arrive', 'start', 'cancel', 'no-show'],
  customer_arrived: ['start', 'cancel'],
  in_progress: ['complete'],
}

export function BusinessAppointmentsPage() {
  const { t, statusLabel } = useLocale()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const membershipsQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })

  const businessId = params.get('businessId') || membershipsQuery.data?.[0]?.businessId || ''

  const appointmentsQuery = useQuery({
    queryKey: ['business-appointments', businessId, statusFilter],
    queryFn: () =>
      listBusinessAppointments(businessId, statusFilter ? { status: statusFilter } : undefined),
    enabled: Boolean(businessId),
  })

  const actionMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string
      action: 'confirm' | 'reject' | 'cancel' | 'arrive' | 'start' | 'complete' | 'no-show'
    }) =>
      transitionAppointment(id, action, action === 'reject' || action === 'cancel' ? { reason: 'Updated by garage' } : undefined),
    onSuccess: () => {
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['business-appointments', businessId] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const memberships = membershipsQuery.data ?? []
  const items = appointmentsQuery.data ?? []

  const title = useMemo(() => {
    const m = memberships.find((x) => x.businessId === businessId)
    return m?.business.displayName ?? t('biz.nav.appointments')
  }, [memberships, businessId, t])

  if (membershipsQuery.isLoading) return <Spinner />

  if (!businessId) {
    return (
      <section className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <h2 className="text-xl font-semibold">{t('biz.nav.appointments')}</h2>
        <p className="text-sm text-text-muted">
          {t('biz.noGarageSelected')}{' '}
          <Link to="/business/applications" className="text-primary">
            {t('biz.shellApplyTitle')}
          </Link>
        </p>
      </section>
    )
  }

  return (
    <RequireGarageSetup businessId={businessId}>
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-text-muted">{t('biz.appointments.subtitle')}</p>
      </div>

      {memberships.length > 1 && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('common.garage')}</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={businessId}
            onChange={(e) => {
              const next = new URLSearchParams(params)
              next.set('businessId', e.target.value)
              navigate(`/business/appointments?${next.toString()}`)
            }}
          >
            {memberships.map((m) => (
              <option key={m.businessId} value={m.businessId}>
                {m.business.displayName}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">{t('common.status')}</span>
        <select
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t('common.all')}</option>
          <option value="requested">{statusLabel('requested')}</option>
          <option value="confirmed">{statusLabel('confirmed')}</option>
          <option value="in_progress">{statusLabel('in_progress')}</option>
          <option value="completed">{statusLabel('completed')}</option>
          <option value="cancelled_by_business">{statusLabel('cancelled_by_business')}</option>
        </select>
      </label>

      {error && <p className="text-sm text-error">{error}</p>}
      {appointmentsQuery.isLoading && <Spinner />}

      <ul className="space-y-3">
        {items.length === 0 && !appointmentsQuery.isLoading && (
          <li className="text-sm text-text-muted">{t('biz.appointments.empty')}</li>
        )}
        {items.map((raw) => {
          const id = String(raw.id ?? '')
          const status = String(raw.status ?? '')
          const start = String(raw.scheduledStart ?? raw.scheduled_start ?? '')
          const actions = ACTIONS[status] ?? []
          return (
            <li key={id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex justify-between gap-2">
                <Link
                  to={`/business/appointments/${id}?businessId=${encodeURIComponent(businessId)}`}
                  className="text-sm font-semibold text-primary"
                >
                  {statusLabel(status)}
                </Link>
                <span className="text-xs text-text-muted">
                  {start ? new Date(start).toLocaleString() : '—'}
                </span>
              </div>
              <Link
                to={`/business/appointments/${id}?businessId=${encodeURIComponent(businessId)}`}
                className="mt-1 inline-block text-xs text-text-muted"
              >
                {t('biz.appointments.viewDetails')}
              </Link>
              {actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {actions.map((action) => {
                    const isThis =
                      actionMutation.isPending &&
                      actionMutation.variables?.id === id &&
                      actionMutation.variables?.action === action
                    return (
                      <Button
                        key={action}
                        variant={action === 'reject' || action === 'cancel' ? 'danger' : 'secondary'}
                        loading={isThis}
                        disabled={actionMutation.isPending && !isThis}
                        onClick={() => actionMutation.mutate({ id, action })}
                      >
                        {t(`biz.appointment.action.${action}`)}
                      </Button>
                    )
                  })}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
    </RequireGarageSetup>
  )
}
