import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { vehicleLabelLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { deleteVehicle, getVehicle, makeVehicleDefault } from '../services/api/vehicles'

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => getVehicle(id!),
    enabled: !!id,
  })

  const defaultMutation = useMutation({
    mutationFn: () => makeVehicleDefault(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteVehicle(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      navigate('/vehicles', { replace: true })
    },
  })

  if (isLoading) return <Spinner />
  if (error || !vehicle) {
    return (
      <div>
        <PageHeader title={t('common.vehicle')} backTo="/vehicles" />
        <EmptyState
          title={t('vehicles.notFound')}
          actionLabel={t('common.back')}
          onAction={() => navigate('/vehicles')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={vehicleLabelLocalized(vehicle, t)} backTo="/vehicles" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {vehicle.isDefault && (
          <span className="mb-4 inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
            {t('common.defaultVehicle')}
          </span>
        )}

        <dl className="space-y-3 rounded-2xl border border-border bg-surface p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">{t('common.year')}</dt>
            <dd>{vehicle.year}</dd>
          </div>
          {vehicle.makeText && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.make')}</dt>
              <dd>{vehicle.makeText}</dd>
            </div>
          )}
          {vehicle.modelText && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.model')}</dt>
              <dd>{vehicle.modelText}</dd>
            </div>
          )}
          {vehicle.plateNumber && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.plate')}</dt>
              <dd>{vehicle.plateNumber}</dd>
            </div>
          )}
          {vehicle.vin && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.vin')}</dt>
              <dd className="text-right text-xs">{vehicle.vin}</dd>
            </div>
          )}
          {vehicle.color && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.color')}</dt>
              <dd>{vehicle.color}</dd>
            </div>
          )}
          {vehicle.trim && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.trim')}</dt>
              <dd>{vehicle.trim}</dd>
            </div>
          )}
          {vehicle.mileage != null && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.mileage')}</dt>
              <dd>
                {vehicle.mileage.toLocaleString()} {vehicle.mileageUnit ?? t('common.km')}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 space-y-2">
          {!vehicle.isDefault && (
            <Button className="w-full" loading={defaultMutation.isPending} onClick={() => defaultMutation.mutate()}>
              {t('vehicles.setDefault')}
            </Button>
          )}
          <Link to={`/vehicles/${id}/edit`}>
            <Button variant="secondary" className="w-full">
              {t('vehicles.edit')}
            </Button>
          </Link>
          <Button
            variant="danger"
            className="w-full"
            loading={deleteMutation.isPending}
            onClick={() => {
              if (window.confirm(t('common.deleteVehicleConfirm'))) deleteMutation.mutate()
            }}
          >
            {t('vehicles.delete')}
          </Button>
        </div>
      </div>
    </div>
  )
}
