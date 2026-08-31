import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDateLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { listAppointments } from '../services/api/appointments'

export function AppointmentsPage() {
  const { t, dateLocale } = useLocale()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => listAppointments(),
  })

  return (
    <div>
      <PageHeader title={t('appointments.title')} />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title={t('appointments.loadError')}
            description={t('appointments.loadErrorDesc')}
            actionLabel={t('common.retry')}
            onAction={() => refetch()}
          />
        )}
        {data?.length === 0 && (
          <EmptyState
            title={t('appointments.empty')}
            description={t('appointments.emptyDesc')}
            actionLabel={t('common.searchGarages')}
            onAction={() => {
              window.location.href = '/search'
            }}
            icon="📅"
          />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((appt) => (
              <Link
                key={appt.id}
                to={`/appointments/${appt.id}`}
                className="block rounded-2xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {appt.businessName ?? t('appointments.detail')}
                    </h3>
                    {appt.branchName && <p className="text-sm text-text-muted">{appt.branchName}</p>}
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
                <p className="mt-3 text-sm text-text-secondary">
                  {formatDateLocalized(appt.scheduledStart, dateLocale)}
                </p>
                {appt.services.length > 0 && (
                  <p className="mt-1 text-sm text-text-muted">
                    {appt.services.map((s) => s.serviceName).join(', ')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
