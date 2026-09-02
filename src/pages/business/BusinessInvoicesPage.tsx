import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import {
  cancelBusinessInvoice,
  issueBusinessInvoice,
  listBusinessInvoices,
  listMyBusinessMemberships,
  recordInvoiceCashPayment,
  updateBusinessSettings,
} from '../../services/api/business'

export function BusinessInvoicesPage() {
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
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  if (membershipsQuery.isLoading) return <Spinner />
  if (!businessId) {
    return (
      <p className="p-4 text-sm">
        No garage selected. <Link to="/business">Dashboard</Link>
      </p>
    )
  }

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <p className="text-sm text-text-muted">
          Create invoices from accepted/issued quotations on the Quotations page.
        </p>
        {error && <p className="text-sm text-error">{error}</p>}
        {invoicesQuery.isLoading && <Spinner />}

        <ul className="space-y-3">
          {(invoicesQuery.data ?? []).map((inv) => {
            const id = String(inv.id ?? '')
            const status = String(inv.status ?? '')
            const total = inv.totalAmount ?? inv.total ?? inv.amountDue
            return (
              <li key={id} className="rounded-xl border border-border bg-surface p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <strong className="capitalize">{status.replaceAll('_', ' ')}</strong>
                  <span className="text-text-muted">
                    {total != null ? `${total} BHD` : id.slice(0, 8)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {status === 'draft' && (
                    <Button
                      variant="secondary"
                      loading={issueMutation.isPending}
                      onClick={() => issueMutation.mutate(id)}
                    >
                      Issue
                    </Button>
                  )}
                  {(status === 'draft' || status === 'issued' || status === 'awaiting_payment') && (
                    <Button
                      variant="danger"
                      loading={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {(status === 'issued' ||
                  status === 'awaiting_payment' ||
                  status === 'partially_paid' ||
                  status === 'approved') && (
                  <div className="mt-3 flex items-end gap-2">
                    <Input
                      label="Cash payment"
                      value={cashAmounts[id] ?? ''}
                      onChange={(e) =>
                        setCashAmounts((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                      placeholder="Amount"
                    />
                    <Button
                      loading={cashMutation.isPending}
                      onClick={() =>
                        cashMutation.mutate({
                          invoiceId: id,
                          amount: Number(cashAmounts[id] || total || 0),
                        })
                      }
                    >
                      Record
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
          {!invoicesQuery.isLoading && (invoicesQuery.data ?? []).length === 0 && (
            <li className="text-sm text-text-muted">No invoices yet.</li>
          )}
        </ul>
      </section>
    </RequireGarageSetup>
  )
}
