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
  approveInvoice,
  getInvoice,
  listInvoicePayments,
  viewInvoice,
} from '../services/api/invoices'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, statusLabel, dateLocale } = useLocale()

  const invoiceQuery = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: !!id,
  })

  const paymentsQuery = useQuery({
    queryKey: ['invoice-payments', id],
    queryFn: () => listInvoicePayments(id!),
    enabled: !!id,
  })

  const viewMutation = useMutation({
    mutationFn: () => viewInvoice(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  })

  const approveMutation = useMutation({
    mutationFn: () => approveInvoice(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  })

  const inv = invoiceQuery.data

  if (invoiceQuery.isLoading) return <Spinner />
  if (invoiceQuery.error || !inv) {
    return (
      <div>
        <PageHeader title={t('invoices.detail')} backTo="/invoices" />
        <EmptyState
          title={t('invoices.notFound')}
          actionLabel={t('common.back')}
          onAction={() => navigate('/invoices')}
        />
      </div>
    )
  }

  const needsView = inv.status === 'issued'
  const needsApproval = inv.requiresCustomerApproval && ['issued', 'viewed'].includes(inv.status)

  return (
    <div>
      <PageHeader title={inv.invoiceNumber} backTo="/invoices" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {inv.businessName && <p className="text-sm text-text-muted">{inv.businessName}</p>}
          </div>
          <StatusBadge status={inv.status} />
        </div>

        <dl className="mt-4 space-y-2 rounded-2xl border border-border bg-surface p-4 text-sm">
          {inv.issuedAt && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.issued')}</dt>
              <dd>{formatDateLocalized(inv.issuedAt, dateLocale)}</dd>
            </div>
          )}
          {inv.dueAt && (
            <div className="flex justify-between">
              <dt className="text-text-muted">{t('common.due')}</dt>
              <dd>{formatDateLocalized(inv.dueAt, dateLocale)}</dd>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <dt>{t('common.total')}</dt>
            <dd>{formatMoney(inv.grandTotal, inv.currency)}</dd>
          </div>
          {inv.remainingTotal > 0 && (
            <div className="flex justify-between text-warning">
              <dt>{t('common.remaining')}</dt>
              <dd>{formatMoney(inv.remainingTotal, inv.currency)}</dd>
            </div>
          )}
        </dl>

        <section className="mt-4">
          <h3 className="mb-2 font-semibold text-text-primary">{t('common.lineItems')}</h3>
          <div className="space-y-2">
            {inv.items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span>{item.description}</span>
                  <span className="font-medium">{formatMoney(item.lineTotal, inv.currency)}</span>
                </div>
                <p className="text-text-muted">
                  {t('common.qtyPrice', {
                    quantity: item.quantity,
                    unitPrice: formatMoney(item.unitPrice, inv.currency),
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>

        {paymentsQuery.data && paymentsQuery.data.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 font-semibold text-text-primary">{t('common.payments')}</h3>
            <div className="space-y-2">
              {paymentsQuery.data.map((pay) => (
                <div key={pay.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{pay.paymentReference}</span>
                    <StatusBadge status={pay.status} />
                  </div>
                  <p className="mt-1 text-text-muted">
                    {formatMoney(pay.amount, inv.currency)} · {statusLabel(pay.method)}
                    {pay.paidAt && ` · ${formatDateLocalized(pay.paidAt, dateLocale)}`}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 space-y-2">
          {needsView && (
            <Button className="w-full" loading={viewMutation.isPending} onClick={() => viewMutation.mutate()}>
              {t('invoices.markViewed')}
            </Button>
          )}
          {needsApproval && (
            <Button
              className="w-full"
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              {t('invoices.approve')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
