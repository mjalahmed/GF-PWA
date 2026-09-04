import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useLocale } from '../../i18n/LocaleProvider'
import { getAdminAppointment } from '../../services/api/admin'

export function AdminAppointmentDetailPage() {
  const { appointmentId = '' } = useParams()
  const { t, statusLabel } = useLocale()

  const detailQuery = useQuery({
    queryKey: ['admin-appointment', appointmentId],
    queryFn: () => getAdminAppointment(appointmentId),
    enabled: Boolean(appointmentId),
  })

  if (detailQuery.isLoading) return <Spinner />
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Link to="/admin/appointments" className="text-sm text-primary">
          ← {t('admin.appointments.title')}
        </Link>
        <EmptyState
          title={t('admin.appointments.notFound')}
          description={
            detailQuery.error instanceof Error ? detailQuery.error.message : undefined
          }
        />
      </section>
    )
  }

  const raw = detailQuery.data
  const status = String(raw.status ?? '')
  const start = String(raw.scheduledStart ?? raw.scheduled_start ?? '')
  const customer = (raw.customer as Record<string, unknown> | undefined) ?? {}
  const vehicle = (raw.vehicle as Record<string, unknown> | undefined) ?? {}
  const customerId = String(raw.customerId ?? raw.customer_id ?? customer.id ?? '')
  const vehicleId = String(raw.vehicleId ?? raw.vehicle_id ?? vehicle.id ?? '')
  const businessName = String(raw.businessName ?? raw.business_name ?? t('common.garage'))
  const customerName = String(
    customer.fullName ?? customer.full_name ?? raw.customerName ?? raw.customer_name ?? '—',
  )
  const vehicleLabel =
    [vehicle.makeText ?? vehicle.make_text, vehicle.modelText ?? vehicle.model_text, vehicle.year]
      .filter(Boolean)
      .join(' ') ||
    String(raw.vehicleLabel ?? '—')

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <Link to="/admin/appointments" className="text-sm text-primary">
        ← {t('admin.appointments.title')}
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">{t('admin.appointments.detailTitle')}</h2>
          <p className="text-sm text-text-muted">
            {start ? new Date(start).toLocaleString() : '—'}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <dl className="space-y-3 rounded-xl border border-border bg-surface p-4 text-sm">
        <div>
          <dt className="text-text-muted">{t('common.garage')}</dt>
          <dd className="font-medium">{businessName}</dd>
        </div>
        <div>
          <dt className="text-text-muted">{t('common.customer')}</dt>
          <dd className="font-medium">{customerName}</dd>
          {customerId && (
            <dd>
              <Link to={`/admin/users/${customerId}`} className="text-primary">
                {t('admin.appointments.viewCustomer')}
              </Link>
            </dd>
          )}
        </div>
        <div>
          <dt className="text-text-muted">{t('common.vehicle')}</dt>
          <dd className="font-medium">{vehicleLabel}</dd>
          {vehicleId && (
            <dd>
              <Link to={`/admin/vehicles/${vehicleId}`} className="text-primary">
                {t('admin.appointments.viewVehicle')}
              </Link>
            </dd>
          )}
        </div>
        {Boolean(raw.customerNotes || raw.customer_notes) && (
          <div>
            <dt className="text-text-muted">{t('admin.appointments.customerNotes')}</dt>
            <dd>{String(raw.customerNotes ?? raw.customer_notes)}</dd>
          </div>
        )}
        <div>
          <dt className="text-text-muted">{t('common.status')}</dt>
          <dd>{statusLabel(status)}</dd>
        </div>
      </dl>
    </section>
  )
}
