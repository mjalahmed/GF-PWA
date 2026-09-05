import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { MakeLogo } from '../../components/ui/MakeLogo'
import { Spinner } from '../../components/ui/Spinner'
import { useLocale } from '../../i18n/LocaleProvider'
import { formatMoney } from '../../lib/utils'
import {
  cancelBusinessInvoice,
  confirmInvoicePayment,
  issueBusinessInvoice,
  listBusinessInvoices,
  listMyBusinessMemberships,
  recordInvoiceCashPayment,
  sendInvoicePaymentReminder,
  updateBusinessSettings,
} from '../../services/api/business'

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function BusinessInvoicesPage() {
  const { t, statusLabel } = useLocale()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [cashAmounts, setCashAmounts] = useState<Record<string, string>>({})

  const membershipsQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })
  const businessId = params.get('businessId') || membershipsQuery.data?.[0]?.businessId || ''

  const invoicesQuery = useQuery({
    queryKey: ['business-invoices', businessId],
    queryFn: async () => {
      await updateBusinessSettings(businessId, {
        invoicesEnabled: true,
        cashPaymentsEnabled: true,
      }).catch(() => undefined)
      return listBusinessInvoices(businessId)
    },
    enabled: Boolean(businessId),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['business-invoices', businessId] })
  }

  const issueMutation = useMutation({
    mutationFn: (invoiceId: string) => issueBusinessInvoice(businessId, invoiceId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })
  const cancelMutation = useMutation({
    mutationFn: (invoiceId: string) => cancelBusinessInvoice(businessId, invoiceId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })
  const cashMutation = useMutation({
    mutationFn: ({ invoiceId, amount }: { invoiceId: string; amount: number }) =>
      recordInvoiceCashPayment(businessId, invoiceId, amount),
    onSuccess: (_data, vars) => {
      setCashAmounts((prev) => ({ ...prev, [vars.invoiceId]: '' }))
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })
  const confirmMutation = useMutation({
    mutationFn: ({ invoiceId, paymentId }: { invoiceId: string; paymentId: string }) =>
      confirmInvoicePayment(businessId, invoiceId, paymentId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })
  const reminderMutation = useMutation({
    mutationFn: (invoiceId: string) => sendInvoicePaymentReminder(businessId, invoiceId),
    onSuccess: () => setError(''),
    onError: (err: Error) => setError(err.message),
  })

  if (membershipsQuery.isLoading) return <Spinner />
  if (!businessId) {
    return (
      <p className="p-4 text-sm">
        {t('biz.noGarageSelected')}{' '}
        <Link to="/business">{t('biz.nav.dashboard')}</Link>
      </p>
    )
  }

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <h2 className="text-xl font-semibold">{t('biz.invoices.title')}</h2>
        <p className="text-sm text-text-muted">{t('biz.invoices.hint')}</p>
        {error && <p className="text-sm text-error">{error}</p>}
        {invoicesQuery.isLoading && <Spinner />}

        <ul className="space-y-3">
          {(invoicesQuery.data ?? []).map((inv) => {
            const id = String(inv.id ?? '')
            const status = String(inv.status ?? '')
            const total = num(inv.totalAmount ?? inv.grandTotal ?? inv.total ?? inv.amountDue)
            const paid = num(inv.amountPaid ?? inv.paidTotal ?? inv.paidAmount)
            const remaining = num(
              inv.remainingTotal ?? inv.amountDue ?? Math.max(total - paid, 0),
            )
            const currency = String(inv.currency ?? 'BHD')
            const customerName = String(
              inv.customerName ??
                inv.customer_name ??
                (inv.customer as Record<string, unknown> | undefined)?.fullName ??
                (inv.customer as Record<string, unknown> | undefined)?.full_name ??
                '—',
            )
            const vehicleMake = String(
              inv.vehicleMake ??
                inv.vehicle_make ??
                (inv.vehicle as Record<string, unknown> | undefined)?.makeText ??
                (inv.vehicle as Record<string, unknown> | undefined)?.make_text ??
                '',
            )
            const vehicleParts = [
              inv.vehicleYear ?? (inv.vehicle as Record<string, unknown> | undefined)?.year,
              vehicleMake ||
                String(
                  (inv.vehicle as Record<string, unknown> | undefined)?.makeText ??
                    (inv.vehicle as Record<string, unknown> | undefined)?.make_text ??
                    '',
                ),
              inv.vehicleModel ??
                (inv.vehicle as Record<string, unknown> | undefined)?.modelText ??
                (inv.vehicle as Record<string, unknown> | undefined)?.model_text,
            ]
              .filter(Boolean)
              .join(' ')
            const vehicleLabel =
              String(inv.vehicleLabel ?? inv.vehicle_label ?? '') || vehicleParts || '—'
            const appointmentId = String(
              inv.appointmentId ?? inv.appointment_id ?? '',
            )
            const due = String(inv.dueAt ?? inv.due_at ?? inv.dueDate ?? inv.due_date ?? '')
            const payments = Array.isArray(inv.payments)
              ? (inv.payments as Record<string, unknown>[])
              : []
            const lastPayment = payments
              .slice()
              .sort((a, b) =>
                String(b.confirmedAt ?? b.confirmed_at ?? b.createdAt ?? '').localeCompare(
                  String(a.confirmedAt ?? a.confirmed_at ?? a.createdAt ?? ''),
                ),
              )[0]
            const pendingPays = payments.filter((p) =>
              ['pending', 'requires_action', 'created', 'authorized'].includes(String(p.status)),
            )
            const canCollect = [
              'issued',
              'awaiting_payment',
              'partially_paid',
              'approved',
              'customer_approved',
              'viewed',
            ].includes(status)

            return (
              <li key={id} className="rounded-xl border border-border bg-surface p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <strong>{statusLabel(status)}</strong>
                  <span className="font-medium">{formatMoney(total, currency)}</span>
                </div>
                <dl className="mt-2 space-y-1 text-text-muted">
                  <div className="flex justify-between gap-2">
                    <dt>{t('common.customer')}</dt>
                    <dd className="text-text-primary">{customerName}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>{t('common.vehicle')}</dt>
                    <dd className="flex items-center gap-2 text-text-primary">
                      <MakeLogo make={vehicleMake} size={20} />
                      <span>{vehicleLabel}</span>
                    </dd>
                  </div>
                  {appointmentId && (
                    <div className="flex justify-between gap-2">
                      <dt>{t('biz.invoices.appointment')}</dt>
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
                  <div className="flex justify-between gap-2">
                    <dt>{t('biz.invoices.paid')}</dt>
                    <dd className="text-text-primary">{formatMoney(paid, currency)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>{t('common.remaining')}</dt>
                    <dd className="text-text-primary">{formatMoney(remaining, currency)}</dd>
                  </div>
                  {due && (
                    <div className="flex justify-between gap-2">
                      <dt>{t('common.due')}</dt>
                      <dd>{new Date(due).toLocaleDateString()}</dd>
                    </div>
                  )}
                  {lastPayment && (
                    <div className="flex justify-between gap-2">
                      <dt>{t('biz.invoices.lastPayment')}</dt>
                      <dd>
                        {formatMoney(num(lastPayment.amount), currency)}
                        {lastPayment.method ? ` · ${statusLabel(String(lastPayment.method))}` : ''}
                      </dd>
                    </div>
                  )}
                </dl>

                {remaining > 0 && (
                  <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-sm font-semibold text-warning">
                    {t('biz.invoices.customerOwes', {
                      amount: formatMoney(remaining, currency),
                    })}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {status === 'draft' && (
                    <Button
                      variant="secondary"
                      loading={issueMutation.isPending && issueMutation.variables === id}
                      onClick={() => issueMutation.mutate(id)}
                    >
                      {t('biz.invoices.issue')}
                    </Button>
                  )}
                  {(status === 'draft' || status === 'issued' || status === 'awaiting_payment') && (
                    <Button
                      variant="danger"
                      loading={cancelMutation.isPending && cancelMutation.variables === id}
                      onClick={() => cancelMutation.mutate(id)}
                    >
                      {t('common.cancel')}
                    </Button>
                  )}
                  {canCollect && remaining > 0 && (
                    <Button
                      variant="secondary"
                      loading={
                        reminderMutation.isPending && reminderMutation.variables === id
                      }
                      onClick={() => reminderMutation.mutate(id)}
                    >
                      {t('biz.invoices.sendReminder')}
                    </Button>
                  )}
                </div>

                {pendingPays.map((p) => (
                  <div key={String(p.id)} className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-warning">
                      {t('biz.invoices.pendingPayment', {
                        method: String(p.method ?? 'payment'),
                        amount: formatMoney(num(p.amount), currency),
                      })}
                    </p>
                    <Button
                      variant="secondary"
                      loading={
                        confirmMutation.isPending &&
                        confirmMutation.variables?.paymentId === String(p.id)
                      }
                      onClick={() =>
                        confirmMutation.mutate({ invoiceId: id, paymentId: String(p.id) })
                      }
                    >
                      {t('biz.invoices.confirmPayment')}
                    </Button>
                  </div>
                ))}

                {canCollect && remaining > 0 && (
                  <div className="mt-3 flex items-end gap-2">
                    <Input
                      label={t('biz.invoices.partialAmount')}
                      value={cashAmounts[id] ?? ''}
                      onChange={(e) =>
                        setCashAmounts((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                      placeholder={String(remaining)}
                    />
                    <Button
                      loading={
                        cashMutation.isPending && cashMutation.variables?.invoiceId === id
                      }
                      onClick={() =>
                        cashMutation.mutate({
                          invoiceId: id,
                          amount: Number(cashAmounts[id] || remaining),
                        })
                      }
                    >
                      {t('biz.invoices.recordCash')}
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
          {!invoicesQuery.isLoading && (invoicesQuery.data ?? []).length === 0 && (
            <li className="text-sm text-text-muted">{t('biz.invoices.empty')}</li>
          )}
        </ul>
      </section>
    </RequireGarageSetup>
  )
}
