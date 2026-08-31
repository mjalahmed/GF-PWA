import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDateLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { formatMoney } from '../lib/utils'
import {
  acceptQuotation,
  getQuotation,
  rejectQuotation,
  viewQuotation,
} from '../services/api/quotations'

export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, dateLocale } = useLocale()

  const quotationQuery = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => getQuotation(id!),
    enabled: !!id,
  })

  const viewMutation = useMutation({
    mutationFn: () => viewQuotation(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotation', id] }),
  })

  const acceptMutation = useMutation({
    mutationFn: () => acceptQuotation(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotation', id] }),
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectQuotation(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotation', id] }),
  })

  const q = quotationQuery.data

  if (quotationQuery.isLoading) return <Spinner />
  if (quotationQuery.error || !q) {
    return (
      <div>
        <PageHeader title={t('quotations.detail')} backTo="/quotations" />
        <EmptyState
          title={t('quotations.notFound')}
          actionLabel={t('common.back')}
          onAction={() => navigate('/quotations')}
        />
      </div>
    )
  }

  const pending = ['issued', 'viewed', 'sent'].includes(q.status)

  return (
    <div>
      <PageHeader title={q.quotationNumber} backTo="/quotations" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>{q.businessName && <p className="text-sm text-text-muted">{q.businessName}</p>}</div>
          <StatusBadge status={q.status} />
        </div>

        <dl className="mt-4 space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
          {q.validUntil && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.validUntil')}</dt>
              <dd>{formatDateLocalized(q.validUntil, dateLocale)}</dd>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <dt>{t('common.total')}</dt>
            <dd>{formatMoney(q.grandTotal, q.currency)}</dd>
          </div>
        </dl>

        <section className="mt-4">
          <h3 className="mb-2 font-semibold text-text-primary">{t('common.lineItems')}</h3>
          <div className="space-y-2">
            {q.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span>{item.description}</span>
                  <span className="font-medium">{formatMoney(item.lineTotal, q.currency)}</span>
                </div>
                <p className="text-text-muted">
                  {t('common.qtyPrice', {
                    quantity: item.quantity,
                    unitPrice: formatMoney(item.unitPrice, q.currency),
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 space-y-2">
          {q.status === 'issued' && (
            <Button className="w-full" loading={viewMutation.isPending} onClick={() => viewMutation.mutate()}>
              {t('quotations.markViewed')}
            </Button>
          )}
          {pending && (
            <>
              <Button className="w-full" loading={acceptMutation.isPending} onClick={() => acceptMutation.mutate()}>
                {t('quotations.accept')}
              </Button>
              <Button
                variant="danger"
                className="w-full"
                loading={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
              >
                {t('quotations.reject')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
