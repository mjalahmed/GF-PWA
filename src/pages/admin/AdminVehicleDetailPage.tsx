import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { StorageImage } from '../../components/ui/StorageImage'
import { vehicleLabelLocalized } from '../../i18n/format'
import { useLocale } from '../../i18n/LocaleProvider'
import {
  adminRequestVehicleCorrection,
  adminVerifyVehicle,
  getAdminVehicle,
} from '../../services/api/admin'

export function AdminVehicleDetailPage() {
  const { vehicleId = '' } = useParams()
  const { t, statusLabel } = useLocale()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const detailQuery = useQuery({
    queryKey: ['admin-vehicle', vehicleId],
    queryFn: () => getAdminVehicle(vehicleId),
    enabled: Boolean(vehicleId),
  })

  const verifyMutation = useMutation({
    mutationFn: () => adminVerifyVehicle(vehicleId),
    onSuccess: () => {
      setMessage(t('admin.vehicles.verifiedOk'))
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['admin-vehicle', vehicleId] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const correctionMutation = useMutation({
    mutationFn: () => adminRequestVehicleCorrection(vehicleId, reason.trim() || undefined),
    onSuccess: () => {
      setMessage(t('admin.vehicles.correctionOk'))
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['admin-vehicle', vehicleId] })
    },
    onError: (err: Error) => setError(err.message),
  })

  if (detailQuery.isLoading) return <Spinner />
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Link to="/admin/vehicles" className="text-sm text-primary">
          ← {t('admin.vehicles.title')}
        </Link>
        <EmptyState
          title={t('admin.vehicles.notFound')}
          description={
            detailQuery.error instanceof Error ? detailQuery.error.message : undefined
          }
        />
      </section>
    )
  }

  const { vehicle, history } = detailQuery.data
  const label = vehicleLabelLocalized(
    { year: vehicle.year ?? 0, makeText: vehicle.makeText, modelText: vehicle.modelText },
    t,
  )

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <Link to="/admin/vehicles" className="text-sm text-primary">
        ← {t('admin.vehicles.title')}
      </Link>

      {vehicle.imagePath && (
        <StorageImage
          bucket="vehicle-images"
          path={vehicle.imagePath}
          alt={label}
          className="aspect-video w-full rounded-2xl object-cover"
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{label}</h2>
          {vehicle.plateNumber && (
            <p className="font-mono text-sm text-text-muted">{vehicle.plateNumber}</p>
          )}
          <p className="mt-1 text-sm text-text-muted">
            {vehicle.ownerName || vehicle.ownerEmail || t('admin.vehicles.unknownOwner')}
          </p>
        </div>
        {vehicle.verificationStatus && <StatusBadge status={vehicle.verificationStatus} />}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <Button loading={verifyMutation.isPending} onClick={() => verifyMutation.mutate()}>
          {t('admin.vehicles.verify')}
        </Button>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
        <Input
          label={t('admin.vehicles.correctionReason')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button
          variant="secondary"
          loading={correctionMutation.isPending}
          onClick={() => correctionMutation.mutate()}
        >
          {t('admin.vehicles.requestCorrection')}
        </Button>
      </div>

      <section className="space-y-2">
        <h3 className="font-semibold">{t('admin.vehicles.history')}</h3>
        {(history ?? []).length === 0 && (
          <p className="text-sm text-text-muted">{t('admin.vehicles.noHistory')}</p>
        )}
        <ul className="space-y-2">
          {(history ?? []).map((item, idx) => {
            const id = String(item.id ?? idx)
            const status = String(item.status ?? '')
            const when = String(item.occurredAt ?? item.occurred_at ?? item.createdAt ?? '')
            const apptId = (item.appointmentId ?? item.appointment_id) as string | undefined
            return (
              <li key={id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                <p className="font-medium">{String(item.title ?? item.type ?? id)}</p>
                <p className="text-xs text-text-muted">
                  {when ? new Date(when).toLocaleString() : ''}
                  {status ? ` · ${statusLabel(status)}` : ''}
                </p>
                {apptId && (
                  <Link to={`/admin/appointments/${apptId}`} className="mt-1 inline-block text-primary">
                    {t('admin.vehicles.viewAppointment')}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </section>
  )
}
