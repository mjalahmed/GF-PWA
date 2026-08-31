import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDate, formatStatus } from '../lib/utils'
import { listDisputes } from '../services/api/disputes'

export function DisputesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['disputes'],
    queryFn: () => listDisputes(),
  })

  return (
    <div>
      <PageHeader
        title="Disputes"
        backTo="/profile"
        action={
          <Link to="/disputes/new" className="text-sm font-medium text-primary">
            New
          </Link>
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        <Link to="/disputes/new" className="mb-4 block">
          <Button className="w-full">Open a dispute</Button>
        </Link>

        {isLoading && <Spinner />}
        {error && (
          <EmptyState title="Could not load disputes" actionLabel="Retry" onAction={() => refetch()} />
        )}
        {data?.length === 0 && (
          <EmptyState title="No disputes" description="We hope you never need this, but we're here if you do." />
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
                  {formatStatus(d.reasonCode)} · {formatDate(d.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
