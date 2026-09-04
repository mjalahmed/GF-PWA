import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { vehicleLabelLocalized } from '../../i18n/format'
import { useLocale } from '../../i18n/LocaleProvider'
import { getAdminUser, setAdminUserSuspended } from '../../services/api/admin'

export function AdminUserDetailPage() {
  const { userId = '' } = useParams()
  const { t, statusLabel } = useLocale()
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => getAdminUser(userId),
    enabled: Boolean(userId),
  })

  const suspendMutation = useMutation({
    mutationFn: (suspended: boolean) => setAdminUserSuspended(userId, suspended),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-user', userId] })
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  if (detailQuery.isLoading) return <Spinner />
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Link to="/admin/users" className="text-sm text-primary">
          ← {t('admin.users.title')}
        </Link>
        <EmptyState
          title={t('admin.users.notFound')}
          description={
            detailQuery.error instanceof Error ? detailQuery.error.message : undefined
          }
        />
      </section>
    )
  }

  const user = detailQuery.data
  const vehicles = user.vehicles ?? []
  const appointments = user.appointments ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <Link to="/admin/users" className="text-sm text-primary">
        ← {t('admin.users.title')}
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">
            {user.fullName || user.email || user.id.slice(0, 8)}
          </h2>
          {user.email && <p className="text-sm text-text-muted">{user.email}</p>}
          {user.phone && <p className="text-sm text-text-muted">{user.phone}</p>}
        </div>
        <StatusBadge status={user.isSuspended ? 'suspended' : user.status || 'active'} />
      </div>

      {user.roles && user.roles.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 text-sm font-semibold">{t('admin.users.roles')}</h3>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button
        variant={user.isSuspended ? 'secondary' : 'danger'}
        loading={suspendMutation.isPending}
        onClick={() => suspendMutation.mutate(!user.isSuspended)}
      >
        {user.isSuspended ? t('admin.users.enable') : t('admin.users.suspend')}
      </Button>

      <section className="space-y-2">
        <h3 className="font-semibold">{t('admin.users.vehicles')}</h3>
        {vehicles.length === 0 && (
          <p className="text-sm text-text-muted">{t('admin.users.noVehicles')}</p>
        )}
        <ul className="space-y-2">
          {vehicles.map((raw) => {
            const id = String(raw.id ?? '')
            const label = vehicleLabelLocalized(
              {
                year: Number(raw.year ?? 0),
                makeText: (raw.makeText ?? raw.make_text) as string | undefined,
                modelText: (raw.modelText ?? raw.model_text) as string | undefined,
                displayLabel: raw.displayLabel as string | undefined,
              },
              t,
            )
            return (
              <li key={id}>
                <Link
                  to={`/admin/vehicles/${id}`}
                  className="block rounded-xl border border-border bg-surface p-3 text-sm no-underline"
                >
                  <p className="font-medium text-text-primary">{label}</p>
                  {Boolean(raw.registrationNumber || raw.registration_number || raw.plateNumber) && (
                    <p className="text-text-muted">
                      {String(
                        raw.registrationNumber ?? raw.registration_number ?? raw.plateNumber,
                      )}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold">{t('admin.users.appointments')}</h3>
        {appointments.length === 0 && (
          <p className="text-sm text-text-muted">{t('admin.users.noAppointments')}</p>
        )}
        <ul className="space-y-2">
          {appointments.map((raw) => {
            const id = String(raw.id ?? '')
            const status = String(raw.status ?? '')
            const start = String(raw.scheduledStart ?? raw.scheduled_start ?? '')
            return (
              <li key={id}>
                <Link
                  to={`/admin/appointments/${id}`}
                  className="block rounded-xl border border-border bg-surface p-3 text-sm no-underline"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-primary">{statusLabel(status)}</span>
                    <span className="text-xs text-text-muted">
                      {start ? new Date(start).toLocaleString() : '—'}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </section>
  )
}
