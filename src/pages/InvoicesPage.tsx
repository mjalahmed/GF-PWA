import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDateLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { formatMoney } from '../lib/utils'
import { listInvoices } from '../services/api/invoices'

export function InvoicesPage() {
  const { t, dateLocale } = useLocale()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => listInvoices(),
  })

  return (
    <div>
      <PageHeader title={t('invoices.title')} />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title={t('invoices.loadError')}
            actionLabel={t('common.retry')}
            onAction={() => refetch()}
          />
        )}
        {data?.length === 0 && (
          <EmptyState
            title={t('invoices.empty')}
            description={t('invoices.emptyDesc')}
            icon="🧾"
          />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((inv) => (
              <Link
                key={inv.id}
                to={`/invoices/${inv.id}`}
                className="block rounded-2xl border border-border bg-surface p-4 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">{inv.invoiceNumber}</h3>
                    {inv.businessName && <p className="text-sm text-text-muted">{inv.businessName}</p>}
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium">{formatMoney(inv.grandTotal, inv.currency)}</span>
                  {inv.issuedAt && (
                    <span className="text-text-muted">
                      {formatDateLocalized(inv.issuedAt, dateLocale)}
                    </span>
                  )}
                </div>
                {inv.remainingTotal > 0 && inv.remainingTotal < inv.grandTotal && (
                  <p className="mt-1 text-xs text-warning">
                    {t('common.remainingAmount', {
                      amount: formatMoney(inv.remainingTotal, inv.currency),
                    })}
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
