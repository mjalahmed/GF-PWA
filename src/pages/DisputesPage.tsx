import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDateLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { disputeReasonKey } from '../i18n/messages'
import { listDisputes } from '../services/api/disputes'

export function DisputesPage() {
  const { t, dateLocale } = useLocale()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => listDisputes(),
  })

  return (
    <div>
      <PageHeader
        title={t('disputes.title')}
        backTo="/profile"
        action={
          <Link to="/disputes/new" className="text-sm font-medium text-primary">
            {t('common.new')}
          </Link>
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        <Link to="/disputes/new" className="mb-4 block">
          <Button className="w-full">{t('disputes.open')}</Button>
        </Link>

        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title={t('disputes.loadError')}
            actionLabel={t('common.retry')}
            onAction={() => refetch()}
          />
        )}
        {data?.length === 0 && (
          <EmptyState title={t('disputes.empty')} description={t('disputes.emptyDesc')} />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((d) => (
              <Link
                key={d.id}
                to={`/disputes/${d.id}`}
                className="block rounded-2xl border border-border bg-surface p-4 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">{d.disputeNumber}</h3>
                    {d.businessName && <p className="text-sm text-text-muted">{d.businessName}</p>}
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{d.summary}</p>
                <p className="mt-2 text-xs text-text-muted">
                  {t(disputeReasonKey(d.reasonCode))} · {formatDateLocalized(d.createdAt, dateLocale)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
