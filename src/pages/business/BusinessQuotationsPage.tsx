import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { MakeLogo } from '../../components/ui/MakeLogo'
import { Spinner } from '../../components/ui/Spinner'
import { StorageImage } from '../../components/ui/StorageImage'
import { useLocale } from '../../i18n/LocaleProvider'
import { formatMoney } from '../../lib/utils'
import {
  cancelBusinessQuotation,
  createInvoiceFromQuotation,
  createQuotationFromAppointment,
  issueBusinessQuotation,
  listBusinessAppointments,
  listBusinessQuotations,
  listMyBusinessMemberships,
  updateBusinessSettings,
} from '../../services/api/business'

function quoteVehicle(q: Record<string, unknown>) {
  const vehicle = (q.vehicle as Record<string, unknown> | undefined) ?? {}
  return {
    imagePath: (vehicle.imagePath ?? vehicle.image_path ?? q.vehicleImagePath) as
      | string
      | undefined,
    make: String(
      q.vehicleMake ?? q.vehicle_make ?? vehicle.makeText ?? vehicle.make_text ?? '',
    ),
    label:
      String(
        q.vehicleLabel ??
          q.vehicle_label ??
          [vehicle.makeText ?? vehicle.make_text, vehicle.modelText ?? vehicle.model_text, vehicle.year]
            .filter(Boolean)
            .join(' '),
      ) || '—',
  }
}

export function BusinessQuotationsPage() {
  const { t, statusLabel } = useLocale()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [appointmentId, setAppointmentId] = useState('')
  const [itemDesc, setItemDesc] = useState('Service work')
  const [itemPrice, setItemPrice] = useState('50')

  const membershipsQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })
  const businessId = params.get('businessId') || membershipsQuery.data?.[0]?.businessId || ''

  const quotesQuery = useQuery({
    queryKey: ['business-quotations', businessId],
    queryFn: () => listBusinessQuotations(businessId),
    enabled: Boolean(businessId),
  })
  const appointmentsQuery = useQuery({
    queryKey: ['business-appointments', businessId, 'for-quotes'],
    queryFn: () => listBusinessAppointments(businessId),
    enabled: Boolean(businessId),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['business-quotations', businessId] })
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!appointmentId) throw new Error(t('biz.quotes.selectAppointment'))
      await updateBusinessSettings(businessId, { quotationsEnabled: true })
      return createQuotationFromAppointment(businessId, appointmentId, {
        items: [
          {
            itemType: 'custom',
            description: itemDesc.trim() || 'Service',
            quantity: 1,
            unitPrice: Number(itemPrice) || 0,
          },
        ],
      })
    },
    onSuccess: () => {
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const issueMutation = useMutation({
    mutationFn: (quotationId: string) => issueBusinessQuotation(businessId, quotationId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })
  const cancelMutation = useMutation({
    mutationFn: (quotationId: string) => cancelBusinessQuotation(businessId, quotationId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })
  const invoiceMutation = useMutation({
    mutationFn: (quotationId: string) => createInvoiceFromQuotation(businessId, quotationId),
    onSuccess: () => navigate(`/business/invoices?businessId=${businessId}`),
    onError: (err: Error) => setError(err.message),
  })

  if (membershipsQuery.isLoading) return <Spinner />
  if (!businessId) {
    return (
      <p className="p-4 text-sm">
        {t('biz.noGarageSelected')} <Link to="/business">{t('biz.nav.dashboard')}</Link>
      </p>
    )
  }

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <h2 className="text-xl font-semibold">{t('biz.quotes.title')}</h2>
        {error && <p className="text-sm text-error">{error}</p>}

        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <h3 className="font-medium">{t('biz.quotes.createFromAppointment')}</h3>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('biz.quotes.appointment')}</span>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
            >
              <option value="">{t('biz.quotes.select')}</option>
              {(appointmentsQuery.data ?? []).map((a) => (
                <option key={String(a.id)} value={String(a.id)}>
                  {statusLabel(String(a.status))} ·{' '}
                  {a.scheduledStart
                    ? new Date(String(a.scheduledStart)).toLocaleString()
                    : String(a.id).slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <Input
            label={t('biz.quotes.lineItem')}
            value={itemDesc}
            onChange={(e) => setItemDesc(e.target.value)}
          />
          <Input
            label={t('biz.quotes.unitPrice')}
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
          />
          <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            {t('biz.quotes.createDraft')}
          </Button>
        </div>

        {quotesQuery.isLoading && <Spinner />}
        <ul className="space-y-3">
          {(quotesQuery.data ?? []).map((q) => {
            const id = String(q.id ?? '')
            const status = String(q.status ?? '')
            const amount = Number(q.grandTotal ?? q.totalAmount ?? q.total ?? 0)
            const currency = String(q.currency ?? 'BHD')
            const customerName = String(
              q.customerName ??
                q.customer_name ??
                (q.customer as Record<string, unknown> | undefined)?.fullName ??
                '—',
            )
            const serviceName = String(
              q.serviceName ?? q.service_name ?? q.title ?? t('common.service'),
            )
            const vehicle = quoteVehicle(q)
            const appointmentIdVal = String(q.appointmentId ?? q.appointment_id ?? '')
            const issuedAt = String(q.issuedAt ?? q.issued_at ?? q.createdAt ?? q.created_at ?? '')

            return (
              <li key={id} className="overflow-hidden rounded-xl border border-border bg-surface">
                <Link
                  to={`/business/quotations/${id}?businessId=${encodeURIComponent(businessId)}`}
                  className="flex gap-3 p-3 no-underline"
                >
                  {vehicle.imagePath ? (
                    <StorageImage
                      bucket="vehicle-images"
                      path={vehicle.imagePath}
                      alt={vehicle.label}
                      className="h-20 w-24 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-2xl">
                      🚗
                    </div>
                  )}
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="flex justify-between gap-2">
                      <strong className="text-text-primary">{statusLabel(status)}</strong>
                      <span className="font-medium text-text-primary">
                        {formatMoney(amount, currency)}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-text-primary">{customerName}</p>
                    <p className="flex items-center gap-2 text-text-muted">
                      <MakeLogo make={vehicle.make} size={20} />
                      <span>{vehicle.label}</span>
                    </p>
                    <p className="text-text-muted">{serviceName}</p>
                    {appointmentIdVal && (
                      <p className="text-xs text-text-subtle">
                        {t('biz.quotes.appointment')}: {appointmentIdVal.slice(0, 8)}…
                      </p>
                    )}
                    {issuedAt && (
                      <p className="text-xs text-text-subtle">
                        {new Date(issuedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Link>
                <div className="flex flex-wrap gap-2 border-t border-border px-3 py-2">
                  {status === 'draft' && (
                    <Button
                      variant="secondary"
                      loading={issueMutation.isPending && issueMutation.variables === id}
                      onClick={() => issueMutation.mutate(id)}
                    >
                      {t('biz.quotes.issue')}
                    </Button>
                  )}
                  {(status === 'draft' || status === 'issued') && (
                    <Button
                      variant="danger"
                      loading={cancelMutation.isPending && cancelMutation.variables === id}
                      onClick={() => cancelMutation.mutate(id)}
                    >
                      {t('common.cancel')}
                    </Button>
                  )}
                  {(status === 'issued' || status === 'accepted') && (
                    <Button
                      variant="secondary"
                      loading={invoiceMutation.isPending && invoiceMutation.variables === id}
                      onClick={() => invoiceMutation.mutate(id)}
                    >
                      {t('biz.quotes.createInvoice')}
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
          {!quotesQuery.isLoading && (quotesQuery.data ?? []).length === 0 && (
            <li className="text-sm text-text-muted">{t('biz.quotes.empty')}</li>
          )}
        </ul>
      </section>
    </RequireGarageSetup>
  )
}
