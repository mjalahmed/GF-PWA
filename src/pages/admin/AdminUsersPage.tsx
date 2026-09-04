import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { listAdminUsers, setAdminUserSuspended } from '../../services/api/admin'

export function AdminUsersPage() {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => listAdminUsers({ pageSize: 100 }),
  })

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspended }: { id: string; suspended: boolean }) =>
      setAdminUserSuspended(id, suspended),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  if (usersQuery.isLoading) return <Spinner />

  const items = usersQuery.data ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">Users</h2>
        <p className="text-sm text-text-muted">Enable or suspend platform accounts.</p>
      </div>

      {items.length === 0 && (
        <EmptyState
          title="No users loaded"
          description="The admin users API returned nothing, or is not available yet."
        />
      )}

      <ul className="space-y-3">
        {items.map((u) => (
          <li key={u.id} className="rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{u.fullName || u.email || u.id.slice(0, 8)}</p>
                {u.email && <p className="text-text-muted">{u.email}</p>}
                {u.phone && <p className="text-text-muted">{u.phone}</p>}
                {u.roles && u.roles.length > 0 && (
                  <p className="mt-1 text-xs text-text-subtle">{u.roles.join(', ')}</p>
                )}
              </div>
              <StatusBadge status={u.isSuspended ? 'suspended' : u.status || 'active'} />
            </div>
            <div className="mt-3">
              <Button
                variant={u.isSuspended ? 'secondary' : 'danger'}
                loading={suspendMutation.isPending}
                onClick={() =>
                  suspendMutation.mutate({ id: u.id, suspended: !u.isSuspended })
                }
              >
                {u.isSuspended ? 'Enable' : 'Suspend'}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
