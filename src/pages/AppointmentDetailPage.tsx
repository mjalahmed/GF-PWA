import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ServiceStatusTimeline } from '../components/ui/ServiceStatusTimeline'
import { BeforeAfterGallery } from '../components/ui/BeforeAfterGallery'
import { formatDateLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { formatMoney } from '../lib/utils'
import { cancelAppointment, getAppointment } from '../services/api/appointments'
import { getAppointmentMedia } from '../services/api/experience'

const CANCELLABLE = new Set(['requested', 'confirmed', 'pending'])

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, statusLabel, dateLocale } = useLocale()
  const [showCancel, setShowCancel] = useState(false)
  const [reason, setReason] = useState('')

  const { data: appt, isLoading, error } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointment(id!),
    enabled: !!id,
  })

  const mediaQuery = useQuery({
    queryKey: ['repair-photos', id],
    queryFn: () => getAppointmentMedia(id!),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelAppointment(id!, reason.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment', id] })
      setShowCancel(false)
    },
  })

  if (isLoading) return <Spinner />
  if (error || !appt) {
    return (
      <div>
        <PageHeader title={t('appointments.detail')} backTo="/appointments" />
        <EmptyState
          title={t('appointments.notFound')}
          actionLabel={t('common.back')}
          onAction={() => navigate('/appointments')}
        />
      </div>
    )
  }

  const canCancel = CANCELLABLE.has(appt.status)

  return (
    <div>
      <PageHeader title={t('appointments.detail')} backTo="/appointments" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {appt.businessName ?? t('appointments.detail')}
            </h2>
            {appt.branchName && <p className="text-sm text-text-muted">{appt.branchName}</p>}
          </div>
          <StatusBadge status={appt.status} />
        </div>

        <dl className="mt-6 space-y-3 rounded-2xl border border-border bg-surface p-4 text-sm">
          <div>
            <dt className="text-text-muted">{t('common.scheduled')}</dt>
            <dd className="font-medium">{formatDateLocalized(appt.scheduledStart, dateLocale)}</dd>
          </div>
          <div>
            <dt className="text-text-muted">{t('common.status')}</dt>
            <dd>{statusLabel(appt.status)}</dd>
          </div>
          {appt.customerNotes && (
            <div>
              <dt className="text-text-muted">{t('appointments.yourNotes')}</dt>
              <dd>{appt.customerNotes}</dd>
            </div>
          )}
          {appt.cancellationReason && (
            <div>
              <dt className="text-text-muted">{t('appointments.cancelReasonLabel')}</dt>
              <dd>{appt.cancellationReason}</dd>
            </div>
          )}
        </dl>

        <section className="mt-6">
          <h3 className="mb-3 font-semibold text-text-primary">{t('appointments.progress')}</h3>
          <ServiceStatusTimeline status={appt.status} statusHistory={appt.statusHistory} />
        </section>

        {mediaQuery.data && mediaQuery.data.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-3 font-semibold text-text-primary">{t('repair.photos')}</h3>
            <BeforeAfterGallery photos={mediaQuery.data} />
          </section>
        )}

        {appt.services.length > 0 && (
          <section className="mt-4">
            <h3 className="mb-2 font-semibold text-text-primary">{t('common.services')}</h3>
            <div className="space-y-2">
              {appt.services.map((svc) => (
                <div key={svc.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <p className="font-medium">{svc.serviceName}</p>
                  <p className="text-text-muted">
                    {t('common.minutes', { minutes: svc.estimatedDurationMinutes })}
                    {svc.quotedPrice != null && ` · ${formatMoney(svc.quotedPrice)}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {canCancel && !showCancel && (
          <Button variant="danger" className="mt-8 w-full" onClick={() => setShowCancel(true)}>
            {t('appointments.cancel')}
          </Button>
        )}

        {showCancel && (
          <div className="mt-8 space-y-3">
            <Input
              label={t('appointments.cancelReasonOptional')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('appointments.cancelReasonPlaceholder')}
            />
            <Button
              variant="danger"
              className="w-full"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {t('appointments.confirmCancel')}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setShowCancel(false)}>
              {t('appointments.keep')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
