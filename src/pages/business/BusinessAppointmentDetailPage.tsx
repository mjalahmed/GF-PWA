import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { BeforeAfterGallery } from '../../components/ui/BeforeAfterGallery'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatMoney } from '../../lib/utils'
import { uploadFile } from '../../lib/upload'
import { useLocale } from '../../i18n/LocaleProvider'
import {
  createQuotationFromAppointment,
  getBusinessAppointment,
  registerAppointmentMedia,
  setAppointmentStatus,
  transitionAppointment,
} from '../../services/api/business'
import { getAppointmentMedia, type RepairPhoto } from '../../services/api/experience'
import { GENERIC_APPOINTMENT_STATUSES } from '../../types/appointments'

const ACTIONS: Record<
  string,
  Array<'confirm' | 'reject' | 'cancel' | 'arrive' | 'start' | 'complete' | 'no-show'>
> = {
  requested: ['confirm', 'reject'],
  confirmed: ['arrive', 'start', 'cancel', 'no-show'],
  customer_arrived: ['start', 'cancel'],
  quote_accepted: ['arrive', 'start', 'cancel'],
  waiting: ['start', 'complete'],
  waiting_for_parts: ['start', 'complete'],
  waiting_for_customer: ['start', 'complete', 'cancel'],
  in_progress: ['complete'],
  ready_for_pickup: ['complete'],
}

const GENERIC_FROM: Record<string, string[]> = {
  confirmed: ['quote_pending', 'waiting'],
  customer_arrived: ['waiting', 'waiting_for_parts'],
  in_progress: ['waiting', 'waiting_for_parts', 'waiting_for_customer', 'ready_for_pickup', 'disputed'],
  waiting: ['waiting_for_parts', 'waiting_for_customer', 'in_progress', 'ready_for_pickup'],
  waiting_for_parts: ['waiting', 'in_progress', 'ready_for_pickup'],
  waiting_for_customer: ['waiting', 'in_progress', 'ready_for_pickup', 'disputed'],
  quote_pending: ['quote_accepted', 'waiting'],
  quote_accepted: ['waiting', 'in_progress'],
  ready_for_pickup: ['completed', 'disputed'],
}

function vehicleDisplay(appt: {
  vehicle?: {
    displayLabel?: string
    year?: number
    makeText?: string
    modelText?: string
    plateNumber?: string
  }
  vehicleId?: string
}): string {
  const v = appt.vehicle
  if (!v) return appt.vehicleId ? `Vehicle ${appt.vehicleId.slice(0, 8)}…` : '—'
  if (v.displayLabel) return v.displayLabel
  const built = [v.year, v.makeText, v.modelText].filter(Boolean).join(' ')
  return built || v.plateNumber || '—'
}

export function BusinessAppointmentDetailPage() {
  const { appointmentId = '' } = useParams()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const { statusLabel } = useLocale()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [uploadPhase, setUploadPhase] = useState<'before' | 'after'>('before')
  const fileRef = useRef<HTMLInputElement>(null)

  const businessIdHint = params.get('businessId') || ''

  const detailQuery = useQuery({
    queryKey: ['business-appointment', businessIdHint, appointmentId],
    queryFn: async () => {
      if (businessIdHint) {
        try {
          return await getBusinessAppointment(businessIdHint, appointmentId)
        } catch {
          // Fall through if enriched endpoint is unavailable
        }
      }
      const { getAppointment } = await import('../../services/api/appointments')
      return getAppointment(appointmentId)
    },
    enabled: Boolean(appointmentId),
  })

  const businessId = businessIdHint || detailQuery.data?.businessId || ''

  const mediaQuery = useQuery({
    queryKey: ['appointment-media', appointmentId],
    queryFn: () => getAppointmentMedia(appointmentId),
    enabled: Boolean(appointmentId),
    retry: false,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['business-appointment'] })
    void queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
    void queryClient.invalidateQueries({ queryKey: ['business-appointments'] })
    void queryClient.invalidateQueries({ queryKey: ['appointment-media', appointmentId] })
  }

  const actionMutation = useMutation({
    mutationFn: ({
      action,
    }: {
      action: 'confirm' | 'reject' | 'cancel' | 'arrive' | 'start' | 'complete' | 'no-show'
    }) =>
      transitionAppointment(
        appointmentId,
        action,
        action === 'reject' || action === 'cancel' ? { reason: 'Updated by garage' } : undefined,
      ),
    onSuccess: () => {
      setError('')
      setMessage('Status updated.')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => setAppointmentStatus(appointmentId, status),
    onSuccess: () => {
      setError('')
      setMessage('Status updated.')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const quoteMutation = useMutation({
    mutationFn: () => createQuotationFromAppointment(businessId, appointmentId),
    onSuccess: (result) => {
      const id = String(result.id ?? '')
      setMessage(id ? `Quotation created (${id.slice(0, 8)}…).` : 'Quotation created.')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!businessId) throw new Error('Missing business id')
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${businessId}/${appointmentId}/${uploadPhase}/${Date.now()}-${safe}`
      await uploadFile('appointment-media', path, file)
      await registerAppointmentMedia(businessId, appointmentId, {
        phase: uploadPhase,
        storagePath: path,
      })
    },
    onSuccess: () => {
      setMessage('Photo uploaded.')
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  if (detailQuery.isLoading) return <Spinner />
  if (!detailQuery.data) {
    return (
      <section className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <p className="text-error">Appointment not found.</p>
        <Link to="/business/appointments" className="text-primary">
          ← Back to appointments
        </Link>
      </section>
    )
  }

  const appt = detailQuery.data
  const actions = ACTIONS[appt.status] ?? []
  const genericStatuses = (GENERIC_FROM[appt.status] ?? []).filter((s) =>
    (GENERIC_APPOINTMENT_STATUSES as readonly string[]).includes(s),
  )
  const expectedMinutes = appt.services.reduce(
    (sum, s) => sum + (s.estimatedDurationMinutes || 0),
    0,
  )
  const backHref = businessId
    ? `/business/appointments?businessId=${encodeURIComponent(businessId)}`
    : '/business/appointments'

  const customerName = appt.customer?.fullName
  const customerContact = [appt.customer?.phone, appt.customer?.email].filter(Boolean).join(' · ')

  const galleryPhotos: RepairPhoto[] =
    mediaQuery.data && mediaQuery.data.length > 0
      ? mediaQuery.data
      : (appt.media ?? []).map((m) => ({
          id: m.id,
          appointmentId,
          phase: (m.phase === 'before' || m.phase === 'after' || m.phase === 'during'
            ? m.phase
            : 'during') as RepairPhoto['phase'],
          storagePath: m.storagePath,
          caption: m.caption ?? null,
          sortOrder: m.sortOrder ?? 0,
          createdAt: m.createdAt ?? '',
        }))

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Link to={backHref} className="text-sm text-primary">
          ← Appointments
        </Link>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Appointment</h2>
            <p className="text-sm text-text-muted">
              {appt.scheduledStart ? new Date(appt.scheduledStart).toLocaleString() : '—'}
            </p>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        <dl className="space-y-3 rounded-xl border border-border bg-surface p-4 text-sm">
          <div>
            <dt className="text-text-muted">Customer</dt>
            <dd className="font-medium">{customerName || appt.customerId || '—'}</dd>
            {customerContact && <dd className="text-text-muted">{customerContact}</dd>}
          </div>
          <div>
            <dt className="text-text-muted">Vehicle</dt>
            <dd className="font-medium">{vehicleDisplay(appt)}</dd>
            {appt.vehicle?.plateNumber && (
              <dd className="text-text-muted">{appt.vehicle.plateNumber}</dd>
            )}
          </div>
          {appt.startedAt && (
            <div>
              <dt className="text-text-muted">Started</dt>
              <dd>{new Date(appt.startedAt).toLocaleString()}</dd>
            </div>
          )}
          {expectedMinutes > 0 && (
            <div>
              <dt className="text-text-muted">Expected duration</dt>
              <dd>{expectedMinutes} minutes</dd>
            </div>
          )}
          {appt.customerNotes && (
            <div>
              <dt className="text-text-muted">Customer notes</dt>
              <dd>{appt.customerNotes}</dd>
            </div>
          )}
          {appt.businessNotes && (
            <div>
              <dt className="text-text-muted">Business notes</dt>
              <dd>{appt.businessNotes}</dd>
            </div>
          )}
        </dl>

        {appt.services.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Services</h3>
            <ul className="space-y-2">
              {appt.services.map((svc) => (
                <li key={svc.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <p className="font-medium">{svc.serviceName}</p>
                  <p className="text-text-muted">{svc.estimatedDurationMinutes} min</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(appt.quotation || appt.invoice || appt.quotationId || appt.invoiceId) && (
          <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
            <h3 className="font-semibold">Commerce</h3>
            {(appt.quotation || appt.quotationId) && (
              <p>
                Quotation:{' '}
                <Link
                  to={`/business/quotations?businessId=${encodeURIComponent(businessId)}`}
                  className="text-primary"
                >
                  {appt.quotation?.number ?? appt.quotationId?.slice(0, 8)}
                </Link>
                {appt.quotation?.status && ` · ${statusLabel(appt.quotation.status)}`}
                {appt.quotation?.grandTotal != null &&
                  ` · ${formatMoney(appt.quotation.grandTotal, appt.quotation.currency ?? 'BHD')}`}
              </p>
            )}
            {(appt.invoice || appt.invoiceId) && (
              <p>
                Invoice:{' '}
                <Link
                  to={`/business/invoices?businessId=${encodeURIComponent(businessId)}`}
                  className="text-primary"
                >
                  {appt.invoice?.number ?? appt.invoiceId?.slice(0, 8)}
                </Link>
                {appt.invoice?.status && ` · ${statusLabel(appt.invoice.status)}`}
                {appt.invoice?.grandTotal != null &&
                  ` · ${formatMoney(appt.invoice.grandTotal, appt.invoice.currency ?? 'BHD')}`}
              </p>
            )}
          </div>
        )}

        {appt.statusHistory && appt.statusHistory.length > 0 && (
          <section>
            <h3 className="mb-2 font-semibold">Status history</h3>
            <ol className="space-y-2 border-s-2 border-border ps-3">
              {appt.statusHistory.map((h, idx) => (
                <li key={`${h.status}-${h.changedAt}-${idx}`} className="text-sm">
                  <p className="font-medium">{statusLabel(h.status)}</p>
                  <p className="text-xs text-text-muted">
                    {h.changedAt ? new Date(h.changedAt).toLocaleString() : ''}
                    {h.note ? ` · ${h.note}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const isThis =
                actionMutation.isPending && actionMutation.variables?.action === action
              return (
                <Button
                  key={action}
                  variant={action === 'reject' || action === 'cancel' ? 'danger' : 'secondary'}
                  loading={isThis}
                  disabled={actionMutation.isPending && !isThis}
                  onClick={() => actionMutation.mutate({ action })}
                >
                  {action}
                </Button>
              )
            })}
          </div>
        )}

        {genericStatuses.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-muted">Set status</h3>
            <div className="flex flex-wrap gap-2">
              {genericStatuses.map((status) => {
                const isThis =
                  statusMutation.isPending && statusMutation.variables === status
                return (
                  <Button
                    key={status}
                    variant="secondary"
                    loading={isThis}
                    disabled={statusMutation.isPending && !isThis}
                    onClick={() => statusMutation.mutate(status)}
                  >
                    {statusLabel(status)}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {businessId && !appt.quotationId && !appt.quotation && (
          <Button
            variant="secondary"
            loading={quoteMutation.isPending}
            onClick={() => quoteMutation.mutate()}
          >
            Create quotation
          </Button>
        )}

        <section className="space-y-3">
          <h3 className="font-semibold">Before / after</h3>
          {galleryPhotos.length > 0 && <BeforeAfterGallery photos={galleryPhotos} />}
          {businessId && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
                value={uploadPhase}
                onChange={(e) => setUploadPhase(e.target.value as 'before' | 'after')}
              >
                <option value="before">Before</option>
                <option value="after">After</option>
              </select>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadMutation.mutate(file)
                  e.target.value = ''
                }}
              />
              <Button
                variant="secondary"
                loading={uploadMutation.isPending}
                onClick={() => fileRef.current?.click()}
              >
                Upload {uploadPhase} photo
              </Button>
            </div>
          )}
          {!businessId && mediaQuery.isError && (
            <p className="text-xs text-text-muted">Media upload requires a business context.</p>
          )}
        </section>
      </section>
    </RequireGarageSetup>
  )
}
