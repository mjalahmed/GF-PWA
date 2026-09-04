import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { VehicleCard } from '../components/ui/VehicleCard'
import { vehicleLabelLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import {
  confirmVehicle,
  listPendingVehicleConfirmations,
  listVehicles,
  rejectVehicle,
} from '../services/api/vehicles'

export function VehiclesPage() {
  const { t } = useLocale()
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles(),
  })
  const pendingQuery = useQuery({
    queryKey: ['vehicles-pending'],
    queryFn: () => listPendingVehicleConfirmations(),
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmVehicle(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      void queryClient.invalidateQueries({ queryKey: ['vehicles-pending'] })
    },
  })
  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectVehicle(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      void queryClient.invalidateQueries({ queryKey: ['vehicles-pending'] })
    },
  })

  const pending = pendingQuery.data ?? []
  const confirmed = (data ?? []).filter((v) => v.confirmationStatus !== 'pending_confirmation')

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

        {pending.length > 0 && (
          <section className="mb-6 space-y-3">
            <h2 className="text-sm font-semibold text-warning">{t('vehicles.pendingTitle')}</h2>
            <p className="text-xs text-text-muted">{t('vehicles.pendingDesc')}</p>
            {pending.map((vehicle) => (
              <div
                key={vehicle.id}
                className="overflow-hidden rounded-2xl border border-warning/40 bg-warning/5"
              >
                <VehicleCard vehicle={vehicle} to={`/vehicles/${vehicle.id}`} />
                <div className="flex gap-2 border-t border-warning/20 p-4">
                  <Button
                    loading={
                      confirmMutation.isPending && confirmMutation.variables === vehicle.id
                    }
                    onClick={() => confirmMutation.mutate(vehicle.id)}
                  >
                    {t('vehicles.confirm')}
                  </Button>
                  <Button
                    variant="secondary"
                    loading={
                      rejectMutation.isPending && rejectMutation.variables === vehicle.id
                    }
                    onClick={() => rejectMutation.mutate(vehicle.id)}
                  >
                    {t('vehicles.reject')}
                  </Button>
                </div>
                <p className="sr-only">{vehicleLabelLocalized(vehicle, t)}</p>
              </div>
            ))}
          </section>
        )}

        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title={t('vehicles.loadError')}
            actionLabel={t('common.retry')}
            onAction={() => refetch()}
          />
        )}
        {confirmed.length === 0 && !isLoading && pending.length === 0 && (
          <EmptyState
            title={t('vehicles.empty')}
            description={t('vehicles.emptyDesc')}
            icon="🚗"
          />
        )}
        {confirmed.length > 0 && (
          <div className="space-y-3">
            {confirmed.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
