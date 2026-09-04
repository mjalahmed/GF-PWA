import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { listAdminDisputes, adminDisputeAction } from '../../services/api/admin'

export function AdminDisputesPage() {
  const queryClient = useQueryClient()

  const disputesQuery = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => listAdminDisputes(),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      adminDisputeAction(id, action),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-disputes'] }),
  })

  if (disputesQuery.isLoading) return <Spinner />

  const items = disputesQuery.data ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">Dispute resolution</h2>
        <p className="text-sm text-text-muted">Open cases across customers and garages.</p>
      </div>

      {disputesQuery.isError && (
        <p className="text-sm text-error">
          {disputesQuery.error instanceof Error
            ? disputesQuery.error.message
            : 'Failed to load disputes'}
        </p>
      )}

      {items.length === 0 && !disputesQuery.isError && (
        <EmptyState title="No disputes" description="Nothing needs attention right now." />
      )}

      <ul className="space-y-3">
        {items.map((d) => {
          const id = String(d.id ?? '')
          const status = String(d.status ?? '')
          const number = String(d.disputeNumber ?? d.dispute_number ?? id.slice(0, 8))
          const summary = String(d.summary ?? d.description ?? '')
          const businessName = String(d.businessName ?? d.business_name ?? '')
          return (
            <li key={id} className="rounded-xl border border-border bg-surface p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{number}</p>
                  {businessName && <p className="text-text-muted">{businessName}</p>}
                </div>
                <StatusBadge status={status} />
              </div>
              {summary && <p className="mt-2 text-text-secondary line-clamp-2">{summary}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/disputes/${id}`} className="text-primary">
                  Open →
                </Link>
                {!['resolved', 'closed', 'rejected'].includes(status) && (
                  <Button
                    variant="secondary"
                    loading={actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ id, action: 'start-review' })}
                  >
                    Start review
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
