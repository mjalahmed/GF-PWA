import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
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
  submitBenefitPayPayment,
  viewInvoice,
} from '../services/api/invoices'

type PayMethod = 'cash' | 'benefitpay'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, statusLabel, dateLocale } = useLocale()
  const [method, setMethod] = useState<PayMethod | null>(null)
  const [payError, setPayError] = useState('')
  const [payMessage, setPayMessage] = useState('')

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

  const inv = invoiceQuery.data

  const viewMutation = useMutation({
    mutationFn: () => viewInvoice(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  })

  const approveMutation = useMutation({
    mutationFn: () => approveInvoice(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoice', id] }),
  })

  const benefitMutation = useMutation({
    mutationFn: () =>
      submitBenefitPayPayment(id!, {
        amount: inv?.remainingTotal || inv?.grandTotal,
      }),
    onSuccess: () => {
      setPayMessage(t('invoices.benefitSubmitted'))
      setPayError('')
      void queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      void queryClient.invalidateQueries({ queryKey: ['invoice-payments', id] })
    },
    onError: (err: Error) => setPayError(err.message),
  })

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
  const paid =
    inv.status === 'paid' || inv.remainingTotal <= 0 || inv.status === 'refunded'
  const payableStatuses = new Set([
    'issued',
    'viewed',
    'customer_approved',
    'partially_paid',
    'overdue',
    'awaiting_payment',
  ])
  const canPay = !paid && payableStatuses.has(inv.status)

  const cashOk = inv.cashPaymentsEnabled !== false
  const benefitOk = Boolean(inv.benefitPayEnabled)
  const benefitPhone = inv.benefitPayPhone
  const benefitIban = inv.benefitPayIban
  const benefitInstructions = inv.benefitPayInstructions

  const payments = paymentsQuery.data ?? []
  const pendingBenefit = payments.find(
    (p) =>
      (p.method === 'benefitpay' || p.method === 'benefit') &&
      ['pending', 'requires_action', 'created', 'authorized'].includes(p.status),
  )
  const confirmedPayments = payments.filter((p) =>
    ['captured', 'paid', 'confirmed'].includes(p.status),
  )

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

        <section className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <h3 className="font-semibold text-text-primary">{t('invoices.paymentSummary')}</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">{t('invoices.whatFor')}</dt>
              <dd className="text-end font-medium">{inv.invoiceNumber}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">{t('invoices.payTo')}</dt>
              <dd className="text-end font-medium">{inv.businessName ?? t('common.garage')}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-text-muted">{t('common.total')}</dt>
              <dd className="font-semibold">{formatMoney(inv.grandTotal, inv.currency)}</dd>
            </div>
            {inv.remainingTotal > 0 && (
              <div className="flex justify-between gap-2 text-warning">
                <dt>{t('common.remaining')}</dt>
                <dd className="font-semibold">{formatMoney(inv.remainingTotal, inv.currency)}</dd>
              </div>
            )}
            {inv.issuedAt && (
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">{t('common.issued')}</dt>
                <dd>{formatDateLocalized(inv.issuedAt, dateLocale)}</dd>
              </div>
            )}
            {inv.dueAt && (
              <div className="flex justify-between gap-2">
                <dt className="text-text-muted">{t('common.due')}</dt>
                <dd>{formatDateLocalized(inv.dueAt, dateLocale)}</dd>
              </div>
            )}
          </dl>
        </section>

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

        {payments.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 font-semibold text-text-primary">{t('common.payments')}</h3>
            <div className="space-y-2">
              {payments.map((pay) => (
                <div key={pay.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{pay.paymentReference || statusLabel(pay.method)}</span>
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

        {paid && (
          <p className="mt-6 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
            {t('invoices.paidInFull')}
            {confirmedPayments.length > 0 &&
              ` · ${confirmedPayments.map((p) => statusLabel(p.method)).join(', ')}`}
          </p>
        )}

        {pendingBenefit && (
          <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
            {t('invoices.benefitPending')}
          </p>
        )}

        {canPay && !pendingBenefit && (
          <section className="mt-6 space-y-3">
            <h3 className="font-semibold text-text-primary">{t('invoices.chooseMethod')}</h3>
            <div className="grid gap-2">
              {cashOk && (
                <button
                  type="button"
                  onClick={() => setMethod('cash')}
                  className={`rounded-xl border p-4 text-start ${
                    method === 'cash' ? 'border-primary bg-primary-light/30' : 'border-border bg-surface'
                  }`}
                >
                  <p className="font-medium">{t('invoices.payCash')}</p>
                  <p className="mt-1 text-xs text-text-muted">{t('invoices.payCashHint')}</p>
                </button>
              )}
              {(benefitOk || benefitPhone || benefitIban) && (
                <button
                  type="button"
                  onClick={() => setMethod('benefitpay')}
                  className={`rounded-xl border p-4 text-start ${
                    method === 'benefitpay'
                      ? 'border-primary bg-primary-light/30'
                      : 'border-border bg-surface'
                  }`}
                >
                  <p className="font-medium">{t('invoices.payBenefit')}</p>
                  <p className="mt-1 text-xs text-text-muted">{t('invoices.payBenefitHint')}</p>
                </button>
              )}
            </div>

            {method === 'cash' && (
              <div className="rounded-xl border border-border bg-surface-secondary p-4 text-sm">
                <p>{t('invoices.cashInstructions')}</p>
                <p className="mt-2 font-semibold">
                  {formatMoney(inv.remainingTotal || inv.grandTotal, inv.currency)}
                </p>
              </div>
            )}

            {method === 'benefitpay' && (
              <div className="space-y-3 rounded-xl border border-border bg-surface p-4 text-sm">
                <p className="font-medium">{t('invoices.benefitDetails')}</p>
                {benefitPhone && (
                  <p>
                    <span className="text-text-muted">{t('invoices.benefitPhone')}: </span>
                    {benefitPhone}
                  </p>
                )}
                {benefitIban && (
                  <p>
                    <span className="text-text-muted">{t('invoices.benefitIban')}: </span>
                    <span className="break-all font-mono text-xs">{benefitIban}</span>
                  </p>
                )}
                {benefitInstructions && <p className="text-text-secondary">{benefitInstructions}</p>}
                {!benefitPhone && !benefitIban && !benefitInstructions && (
                  <p className="text-text-muted">{t('invoices.benefitFallback')}</p>
                )}
                <p className="font-semibold">
                  {formatMoney(inv.remainingTotal || inv.grandTotal, inv.currency)}
                </p>
                {payError && <p className="text-error">{payError}</p>}
                {payMessage && <p className="text-success">{payMessage}</p>}
                <Button
                  className="w-full"
                  loading={benefitMutation.isPending}
                  onClick={() => benefitMutation.mutate()}
                >
                  {t('invoices.iveSubmittedPayment')}
                </Button>
              </div>
            )}
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
