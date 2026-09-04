import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { listAdminBusinesses, setAdminBusinessStatus } from '../../services/api/admin'

export function AdminBusinessesPage() {
  const queryClient = useQueryClient()

  const businessesQuery = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: () => listAdminBusinesses({ pageSize: 100 }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      setAdminBusinessStatus(id, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-businesses'] }),
  })

  if (businessesQuery.isLoading) return <Spinner />

  const items = businessesQuery.data ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">Businesses</h2>
        <p className="text-sm text-text-muted">Enable, suspend, or open capabilities.</p>
      </div>

      {items.length === 0 && (
        <EmptyState
          title="No businesses loaded"
          description="The admin businesses API returned nothing, or is not available yet."
        />
      )}

      <ul className="space-y-3">
        {items.map((b) => {
          const suspended = b.status === 'suspended'
          return (
            <li key={b.id} className="rounded-xl border border-border bg-surface p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{b.displayName}</p>
                  {b.slug && <p className="text-text-muted">/{b.slug}</p>}
                  {b.verificationStatus && (
                    <p className="mt-1 text-xs text-text-subtle">
                      Verification: {b.verificationStatus}
                    </p>
                  )}
                </div>
                <StatusBadge status={b.status || 'active'} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/admin/businesses/${b.id}/capabilities`}
                  className="rounded-lg border border-border px-3 py-1.5 text-primary"
                >
                  Capabilities
                </Link>
                <Link
                  to={`/admin/businesses/${b.id}/setup`}
                  className="rounded-lg border border-border px-3 py-1.5 text-primary"
                >
                  Setup
                </Link>
                <Button
                  variant={suspended ? 'secondary' : 'danger'}
                  loading={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      id: b.id,
                      status: suspended ? 'active' : 'suspended',
                    })
                  }
                >
                  {suspended ? 'Enable' : 'Disable'}
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
