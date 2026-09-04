import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { BeforeAfterGallery } from '../../components/ui/BeforeAfterGallery'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { getAppointment } from '../../services/api/appointments'
import {
  createQuotationFromAppointment,
  transitionAppointment,
} from '../../services/api/business'
import { getAppointmentMedia } from '../../services/api/experience'

const ACTIONS: Record<string, Array<'confirm' | 'reject' | 'cancel' | 'arrive' | 'start' | 'complete' | 'no-show'>> = {
  requested: ['confirm', 'reject'],
  confirmed: ['arrive', 'start', 'cancel', 'no-show'],
  customer_arrived: ['start', 'cancel'],
  in_progress: ['complete'],
}

export function BusinessAppointmentDetailPage() {
  const { appointmentId = '' } = useParams()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const detailQuery = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => getAppointment(appointmentId),
    enabled: Boolean(appointmentId),
  })

  const businessId = params.get('businessId') || detailQuery.data?.businessId || ''

  const mediaQuery = useQuery({
    queryKey: ['appointment-media', appointmentId],
    queryFn: () => getAppointmentMedia(appointmentId),
    enabled: Boolean(appointmentId),
    retry: false,
  })

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
      void queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
      void queryClient.invalidateQueries({ queryKey: ['business-appointments'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  const quoteMutation = useMutation({
    mutationFn: () => createQuotationFromAppointment(businessId, appointmentId),
    onSuccess: (result) => {
      const id = String(result.id ?? '')
      setMessage(id ? `Quotation created (${id.slice(0, 8)}…).` : 'Quotation created.')
      void queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
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
  const expectedMinutes = appt.services.reduce(
    (sum, s) => sum + (s.estimatedDurationMinutes || 0),
    0,
  )
  const backHref = businessId
    ? `/business/appointments?businessId=${encodeURIComponent(businessId)}`
    : '/business/appointments'

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
          {appt.customerId && (
            <div>
              <dt className="text-text-muted">Customer</dt>
              <dd className="font-medium break-all">{appt.customerId}</dd>
            </div>
          )}
          {appt.vehicleId && (
            <div>
              <dt className="text-text-muted">Vehicle</dt>
              <dd className="font-medium break-all">{appt.vehicleId}</dd>
            </div>
          )}
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

        {(appt.quotationId || appt.invoiceId) && (
          <div className="flex flex-wrap gap-3 text-sm">
            {appt.quotationId && (
              <Link
                to={`/business/quotations?businessId=${encodeURIComponent(businessId)}`}
                className="text-primary"
              >
                Related quotation →
              </Link>
            )}
            {appt.invoiceId && (
              <Link
                to={`/business/invoices?businessId=${encodeURIComponent(businessId)}`}
                className="text-primary"
              >
                Related invoice →
              </Link>
            )}
          </div>
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

        {businessId && !appt.quotationId && (
          <Button
            variant="secondary"
            loading={quoteMutation.isPending}
            onClick={() => quoteMutation.mutate()}
          >
            Create quotation
          </Button>
        )}

        {mediaQuery.data && mediaQuery.data.length > 0 && (
          <section>
            <h3 className="mb-2 font-semibold">Before / after</h3>
            <BeforeAfterGallery photos={mediaQuery.data} />
          </section>
        )}
        {mediaQuery.isError && (
          <p className="text-xs text-text-muted">
            Before/after media is unavailable for this appointment (upload API not wired for
            business yet).
          </p>
        )}
      </section>
    </RequireGarageSetup>
  )
}
