import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDate, formatMoney } from '../lib/utils'
import { listQuotations } from '../services/api/quotations'

export function QuotationsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['quotations'],
    queryFn: () => listQuotations(),
  })

  return (
    <div>
      <PageHeader title="Quotations" backTo="/profile" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}
        {error && (
          <EmptyState title="Could not load quotations" actionLabel="Retry" onAction={() => refetch()} />
        )}
        {data?.length === 0 && (
          <EmptyState
            title="No quotations yet"
            description="Quotes from garages will appear here."
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
                    <span className="text-text-muted">Valid until {formatDate(q.validUntil)}</span>
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
