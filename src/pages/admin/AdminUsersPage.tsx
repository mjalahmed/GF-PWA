import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useLocale } from '../../i18n/LocaleProvider'
import { listAdminUsers, setAdminUserSuspended } from '../../services/api/admin'

export function AdminUsersPage() {
  const { t, statusLabel } = useLocale()
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

  if (usersQuery.isError) {
    return (
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <h2 className="text-xl font-semibold">{t('admin.users.title')}</h2>
        <EmptyState
          title={t('admin.users.loadError')}
          description={
            usersQuery.error instanceof Error
              ? usersQuery.error.message
              : t('admin.users.loadErrorDesc')
          }
        />
      </section>
    )
  }

  const items = usersQuery.data ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">{t('admin.users.title')}</h2>
        <p className="text-sm text-text-muted">{t('admin.users.subtitle')}</p>
      </div>

      {items.length === 0 && (
        <EmptyState title={t('admin.users.empty')} description={t('admin.users.emptyDesc')} />
      )}

      <ul className="space-y-3">
        {items.map((u) => (
          <li key={u.id} className="rounded-xl border border-border bg-surface p-4 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  to={`/admin/users/${u.id}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {u.fullName || u.email || u.id.slice(0, 8)}
                </Link>
                {u.email && <p className="text-text-muted">{u.email}</p>}
                {u.phone && <p className="text-text-muted">{u.phone}</p>}
                {u.roles && u.roles.length > 0 && (
                  <p className="mt-1 text-xs text-text-subtle">{u.roles.join(', ')}</p>
                )}
              </div>
              <StatusBadge status={u.isSuspended ? 'suspended' : u.status || 'active'} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/admin/users/${u.id}`}>
                <Button variant="secondary">{t('admin.users.view')}</Button>
              </Link>
              <Button
                variant={u.isSuspended ? 'secondary' : 'danger'}
                loading={
                  suspendMutation.isPending && suspendMutation.variables?.id === u.id
                }
                onClick={() =>
                  suspendMutation.mutate({ id: u.id, suspended: !u.isSuspended })
                }
              >
                {u.isSuspended ? t('admin.users.enable') : t('admin.users.suspend')}
              </Button>
            </div>
            <p className="sr-only">{statusLabel(u.status || 'active')}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
