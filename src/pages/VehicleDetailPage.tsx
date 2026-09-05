import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { StorageImage } from '../components/ui/StorageImage'
import { VinReminderBanner } from '../components/ui/VinReminderBanner'
import { vehicleLabelLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { formatMoney } from '../lib/utils'
import { getVehicleHistoryDetail } from '../services/api/experience'
import { deleteVehicle, getVehicle, makeVehicleDefault } from '../services/api/vehicles'

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, statusLabel } = useLocale()

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => getVehicle(id!),
    enabled: !!id,
  })

  const historyQuery = useQuery({
    queryKey: ['vehicle-history-detail', id],
    queryFn: () => getVehicleHistoryDetail(id!),
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

  const verification = vehicle.verificationStatus || vehicle.confirmationStatus

  return (
    <div>
      <PageHeader title={vehicleLabelLocalized(vehicle, t)} backTo="/vehicles" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {vehicle.imagePath ? (
          <StorageImage
            bucket="vehicle-images"
            path={vehicle.imagePath}
            alt={vehicleLabelLocalized(vehicle, t)}
            className="mb-4 aspect-video w-full rounded-2xl object-cover"
          />
        ) : (
          <div className="mb-4 flex aspect-video w-full items-center justify-center rounded-2xl bg-surface-secondary text-5xl">
            🚗
          </div>
        )}

        {!vehicle.vin && <VinReminderBanner vehicleId={vehicle.id} className="mb-4" />}

        <div className="mb-4 flex flex-wrap gap-2">
          {vehicle.isDefault && (
            <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
              {t('common.defaultVehicle')}
            </span>
          )}
          {verification && <StatusBadge status={verification} />}
        </div>

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
          {(vehicle.vehicleType || vehicle.bodyType) && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('vehicles.vehicleType')}</dt>
              <dd>{t(`vehicles.type.${vehicle.vehicleType || vehicle.bodyType}`)}</dd>
            </div>
          )}
          {vehicle.plateNumber && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.plate')}</dt>
              <dd>{vehicle.plateNumber}</dd>
            </div>
          )}
          {vehicle.vin ? (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.vin')}</dt>
              <dd className="text-right text-xs">{vehicle.vin}</dd>
            </div>
          ) : (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.vin')}</dt>
              <dd className="text-text-subtle">{t('vehicles.vinMissing')}</dd>
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

        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-text-primary">
            {t('vehicles.serviceHistory')}
          </h2>
          {historyQuery.isLoading && <Spinner className="py-4" />}
          {historyQuery.data?.length === 0 && (
            <p className="text-sm text-text-muted">{t('vehicles.noServiceHistory')}</p>
          )}
          <ul className="space-y-3">
            {historyQuery.data?.map((item) => (
              <li
                key={`${item.type}-${item.id}`}
                className="rounded-xl border border-border bg-surface p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">
                      {item.businessName ?? item.title}
                    </p>
                    <p className="text-xs text-text-muted">
                      {item.occurredAt ? new Date(item.occurredAt).toLocaleDateString() : ''} ·{' '}
                      {statusLabel(item.status)}
                    </p>
                  </div>
                  {item.amount != null && (
                    <span className="font-medium">
                      {formatMoney(item.amount, item.currency ?? 'BHD')}
                    </span>
                  )}
                </div>

                {item.media && item.media.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {item.media
                      .filter((m) => m.storagePath)
                      .slice(0, 6)
                      .map((m, idx) => (
                        <StorageImage
                          key={m.id ?? `${item.id}-m-${idx}`}
                          bucket="repair-photos"
                          path={m.storagePath}
                          alt={m.caption ?? ''}
                          className="h-16 w-20 shrink-0 rounded-lg object-cover"
                        />
                      ))}
                  </div>
                )}

                {item.payments && item.payments.length > 0 && (
                  <ul className="mt-2 space-y-1 border-t border-border pt-2 text-xs text-text-muted">
                    {item.payments.map((p, idx) => (
                      <li key={p.id ?? idx}>
                        {t('vehicles.historyPayment', {
                          amount: formatMoney(p.amount ?? 0, item.currency ?? 'BHD'),
                          status: statusLabel(p.status ?? ''),
                          method: p.method ? statusLabel(p.method) : '',
                        })}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {item.appointmentId && (
                    <Link to={`/appointments/${item.appointmentId}`} className="text-primary">
                      {t('vehicles.viewAppointment')}
                    </Link>
                  )}
                  {item.invoiceId && (
                    <Link to={`/invoices/${item.invoiceId}`} className="text-primary">
                      {t('vehicles.viewInvoice')}
                    </Link>
                  )}
                  {item.quotationId && (
                    <Link to={`/quotations/${item.quotationId}`} className="text-primary">
                      {t('vehicles.viewQuote')}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6 space-y-2">
          {!vehicle.isDefault && (
            <Button
              className="w-full"
              loading={defaultMutation.isPending}
              onClick={() => defaultMutation.mutate()}
            >
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
