import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { StorageImage } from '../../components/ui/StorageImage'
import { vehicleLabelLocalized } from '../../i18n/format'
import { useLocale } from '../../i18n/LocaleProvider'
import { listAdminVehicles } from '../../services/api/admin'

export function AdminVehiclesPage() {
  const { t } = useLocale()
  const vehiclesQuery = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: () => listAdminVehicles({ pageSize: 100 }),
  })

  if (vehiclesQuery.isLoading) return <Spinner />

  if (vehiclesQuery.isError) {
    return (
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <h2 className="text-xl font-semibold">{t('admin.vehicles.title')}</h2>
        <EmptyState
          title={t('admin.vehicles.loadError')}
          description={
            vehiclesQuery.error instanceof Error ? vehiclesQuery.error.message : undefined
          }
        />
      </section>
    )
  }

  const items = vehiclesQuery.data ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">{t('admin.vehicles.title')}</h2>
        <p className="text-sm text-text-muted">{t('admin.vehicles.subtitle')}</p>
      </div>

      {items.length === 0 && <EmptyState title={t('admin.vehicles.empty')} />}

      <ul className="space-y-3">
        {items.map((v) => {
          const label = vehicleLabelLocalized(
            { year: v.year ?? 0, makeText: v.makeText, modelText: v.modelText },
            t,
          )
          return (
            <li key={v.id}>
              <Link
                to={`/admin/vehicles/${v.id}`}
                className="flex gap-3 overflow-hidden rounded-xl border border-border bg-surface no-underline"
              >
                {v.imagePath ? (
                  <StorageImage
                    bucket="vehicle-images"
                    path={v.imagePath}
                    alt={label}
                    className="h-24 w-28 shrink-0 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-28 shrink-0 items-center justify-center bg-surface-secondary text-2xl">
                    🚗
                  </div>
                )}
                <div className="min-w-0 flex-1 p-3">
                  <p className="font-semibold text-text-primary">{label}</p>
                  <p className="text-sm text-text-muted">
                    {v.plateNumber || null}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {v.ownerName || v.ownerEmail || t('admin.vehicles.unknownOwner')}
                  </p>
                  {v.verificationStatus && (
                    <div className="mt-2">
                      <StatusBadge status={v.verificationStatus} />
                    </div>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
