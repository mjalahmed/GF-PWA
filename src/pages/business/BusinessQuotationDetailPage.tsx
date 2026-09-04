import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { StorageImage } from '../../components/ui/StorageImage'
import { useLocale } from '../../i18n/LocaleProvider'
import { formatMoney } from '../../lib/utils'
import {
  cancelBusinessQuotation,
  createInvoiceFromQuotation,
  getBusinessQuotation,
  issueBusinessQuotation,
  listMyBusinessMemberships,
} from '../../services/api/business'

export function BusinessQuotationDetailPage() {
  const { quotationId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, statusLabel } = useLocale()
  const [error, setError] = useState('')

  const membershipsQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })
  const businessId = params.get('businessId') || membershipsQuery.data?.[0]?.businessId || ''

  const detailQuery = useQuery({
    queryKey: ['business-quotation', businessId, quotationId],
    queryFn: () => getBusinessQuotation(businessId, quotationId),
    enabled: Boolean(businessId && quotationId),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['business-quotation', businessId, quotationId] })
    void queryClient.invalidateQueries({ queryKey: ['business-quotations', businessId] })
  }

  const issueMutation = useMutation({
    mutationFn: () => issueBusinessQuotation(businessId, quotationId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })
  const cancelMutation = useMutation({
    mutationFn: () => cancelBusinessQuotation(businessId, quotationId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })
  const invoiceMutation = useMutation({
    mutationFn: () => createInvoiceFromQuotation(businessId, quotationId),
    onSuccess: () => navigate(`/business/invoices?businessId=${businessId}`),
    onError: (err: Error) => setError(err.message),
  })

  if (membershipsQuery.isLoading || detailQuery.isLoading) return <Spinner />
  if (!businessId || !detailQuery.data) {
    return (
      <p className="p-4 text-sm">
        {t('biz.quotes.notFound')}{' '}
        <Link to="/business/quotations">{t('biz.quotes.title')}</Link>
      </p>
    )
  }

  const q = detailQuery.data
  const status = String(q.status ?? '')
  const amount = Number(q.grandTotal ?? q.totalAmount ?? q.total ?? 0)
  const currency = String(q.currency ?? 'BHD')
  const vehicle = (q.vehicle as Record<string, unknown> | undefined) ?? {}
  const vehicleLabel =
    String(
      q.vehicleLabel ??
        [vehicle.makeText ?? vehicle.make_text, vehicle.modelText ?? vehicle.model_text, vehicle.year]
          .filter(Boolean)
          .join(' '),
    ) || '—'
  const imagePath = (vehicle.imagePath ?? vehicle.image_path) as string | undefined
  const customerName = String(
    q.customerName ??
      (q.customer as Record<string, unknown> | undefined)?.fullName ??
      '—',
  )
  const appointmentId = String(q.appointmentId ?? q.appointment_id ?? '')
  const serviceName = String(q.serviceName ?? q.service_name ?? q.title ?? '—')
  const issuedAt = String(q.issuedAt ?? q.issued_at ?? '')
  const createdAt = String(q.createdAt ?? q.created_at ?? '')
  const validUntil = String(q.validUntil ?? q.valid_until ?? '')

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Link
          to={`/business/quotations?businessId=${encodeURIComponent(businessId)}`}
          className="text-sm text-primary"
        >
          ← {t('biz.quotes.title')}
        </Link>

        {imagePath && (
          <StorageImage
            bucket="vehicle-images"
            path={imagePath}
            alt={vehicleLabel}
            className="aspect-video w-full rounded-2xl object-cover"
          />
        )}

        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">{customerName}</h2>
            <p className="text-sm text-text-muted">{vehicleLabel}</p>
          </div>
          <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium">
            {statusLabel(status)}
          </span>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <dl className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">{t('common.service')}</dt>
            <dd>{serviceName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">{t('common.total')}</dt>
            <dd className="font-semibold">{formatMoney(amount, currency)}</dd>
          </div>
          {appointmentId && (
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">{t('biz.quotes.appointment')}</dt>
              <dd>
                <Link
                  to={`/business/appointments/${appointmentId}?businessId=${encodeURIComponent(businessId)}`}
                  className="text-primary"
                >
                  {appointmentId.slice(0, 8)}…
                </Link>
              </dd>
            </div>
          )}
          {issuedAt && (
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">{t('common.issued')}</dt>
              <dd>{new Date(issuedAt).toLocaleString()}</dd>
            </div>
          )}
          {createdAt && (
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">{t('biz.quotes.created')}</dt>
              <dd>{new Date(createdAt).toLocaleString()}</dd>
            </div>
          )}
          {validUntil && (
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">{t('common.validUntil')}</dt>
              <dd>{new Date(validUntil).toLocaleDateString()}</dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap gap-2">
          {status === 'draft' && (
            <Button loading={issueMutation.isPending} onClick={() => issueMutation.mutate()}>
              {t('biz.quotes.issue')}
            </Button>
          )}
          {(status === 'draft' || status === 'issued') && (
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              {t('common.cancel')}
            </Button>
          )}
          {(status === 'issued' || status === 'accepted') && (
            <Button
              variant="secondary"
              loading={invoiceMutation.isPending}
              onClick={() => invoiceMutation.mutate()}
            >
              {t('biz.quotes.createInvoice')}
            </Button>
          )}
        </div>
      </section>
    </RequireGarageSetup>
  )
}
