import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDateLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { formatMoney } from '../lib/utils'
import { listQuotations } from '../services/api/quotations'

export function QuotationsPage() {
  const { t, dateLocale } = useLocale()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => listQuotations(),
  })

  return (
    <div>
      <PageHeader title={t('quotations.title')} backTo="/profile" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title={t('quotations.loadError')}
            actionLabel={t('common.retry')}
            onAction={() => refetch()}
          />
        )}
        {data?.length === 0 && (
          <EmptyState
            title={t('quotations.empty')}
            description={t('quotations.emptyDesc')}
            icon="📋"
          />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((q) => (
              <Link
                key={q.id}
                to={`/quotations/${q.id}`}
                className="block rounded-2xl border border-border bg-surface p-4 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">{q.quotationNumber}</h3>
                    {q.businessName && <p className="text-sm text-text-muted">{q.businessName}</p>}
                  </div>
                  <StatusBadge status={q.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium">{formatMoney(q.grandTotal, q.currency)}</span>
                  {q.validUntil && (
                    <span className="text-text-muted">
                      {t('common.validUntilDate', {
                        date: formatDateLocalized(q.validUntil, dateLocale),
                      })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
