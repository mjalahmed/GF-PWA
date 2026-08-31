import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { vehicleLabelLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { listVehicles } from '../services/api/vehicles'

export function VehiclesPage() {
  const { t } = useLocale()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles(),
  })

  return (
    <div>
      <PageHeader
        title={t('vehicles.title')}
        backTo="/profile"
        action={
          <Link to="/vehicles/new" className="text-sm font-medium text-primary">
            {t('common.add')}
          </Link>
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        <Link to="/vehicles/new" className="mb-4 block">
          <Button className="w-full">{t('vehicles.add')}</Button>
        </Link>

        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title={t('vehicles.loadError')}
            actionLabel={t('common.retry')}
            onAction={() => refetch()}
          />
        )}
        {data?.length === 0 && (
          <EmptyState
            title={t('vehicles.empty')}
            description={t('vehicles.emptyDesc')}
            icon="🚗"
          />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((vehicle) => (
              <Link
                key={vehicle.id}
                to={`/vehicles/${vehicle.id}`}
                className="block rounded-2xl border border-border bg-surface p-4 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">
                    {vehicleLabelLocalized(vehicle, t)}
                  </h3>
                  {vehicle.isDefault && (
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                      {t('common.default')}
                    </span>
                  )}
                </div>
                {vehicle.plateNumber && (
                  <p className="mt-1 text-sm text-text-muted">{vehicle.plateNumber}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
