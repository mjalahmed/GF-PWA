import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatMoney } from '../../lib/utils'
import { getAdminTransaction, listAdminTransactions } from '../../services/api/admin'

export function AdminTransactionsPage() {
  const { paymentId } = useParams()

  if (paymentId) {
    return <AdminTransactionDetail paymentId={paymentId} />
  }

  return <AdminTransactionsList />
}

function AdminTransactionsList() {
  const transactionsQuery = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => listAdminTransactions({ limit: 100 }),
  })

  if (transactionsQuery.isLoading) return <Spinner />

  const items = transactionsQuery.data ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">Transactions</h2>
        <p className="text-sm text-text-muted">Platform payment activity.</p>
      </div>

      {transactionsQuery.isError && (
        <p className="text-sm text-error">
          {transactionsQuery.error instanceof Error
            ? transactionsQuery.error.message
            : 'Failed to load transactions'}
        </p>
      )}

      {items.length === 0 && !transactionsQuery.isError && (
        <p className="text-sm text-text-muted">No transactions yet.</p>
      )}

      <ul className="space-y-3">
        {items.map((tx) => (
          <li key={tx.paymentId}>
            <Link
              to={`/admin/transactions/${tx.paymentId}`}
              className="block rounded-xl border border-border bg-surface p-4 no-underline hover:border-primary"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-text-primary">
                    {tx.paymentReference || tx.paymentId.slice(0, 8)}
                  </p>
                  <p className="text-sm text-text-muted">
                    {tx.businessName || 'Garage'} · {tx.customerName || 'Customer'}
                  </p>
                </div>
                <StatusBadge status={tx.status} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-medium">{formatMoney(tx.amount, tx.currency)}</span>
                <span className="capitalize text-text-muted">{tx.method}</span>
              </div>
              {tx.invoiceNumber && (
                <p className="mt-1 text-xs text-text-subtle">Invoice {tx.invoiceNumber}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function AdminTransactionDetail({ paymentId }: { paymentId: string }) {
  const detailQuery = useQuery({
    queryKey: ['admin-transaction', paymentId],
    queryFn: () => getAdminTransaction(paymentId),
  })

  if (detailQuery.isLoading) return <Spinner />

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <section className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <Link to="/admin/transactions" className="text-sm text-primary">
          ← Transactions
        </Link>
        <p className="text-sm text-error">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : 'Transaction not found'}
        </p>
      </section>
    )
  }

  const data = detailQuery.data
  const payment = (data.payment ?? data) as Record<string, unknown>
  const customer = data.customer as Record<string, unknown> | null | undefined
  const business = data.business as Record<string, unknown> | null | undefined
  const invoice = data.invoice as Record<string, unknown> | null | undefined
  const events = Array.isArray(data.events) ? data.events : []
  const auditTrail = Array.isArray(data.auditTrail) ? data.auditTrail : []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <Link to="/admin/transactions" className="text-sm text-primary">
        ← Transactions
      </Link>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold">
            {String(payment.paymentReference ?? payment.payment_reference ?? paymentId.slice(0, 8))}
          </h2>
          <p className="text-sm capitalize text-text-muted">{String(payment.method ?? '')}</p>
        </div>
        <StatusBadge status={String(payment.status ?? '')} />
      </div>

      <dl className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-text-muted">Amount</dt>
          <dd className="font-medium">
            {formatMoney(Number(payment.amount ?? 0), String(payment.currency ?? 'BHD'))}
          </dd>
        </div>
        {business && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Business</dt>
            <dd>{String(business.displayName ?? business.display_name ?? '—')}</dd>
          </div>
        )}
        {customer && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Customer</dt>
            <dd>{String(customer.full_name ?? customer.fullName ?? '—')}</dd>
          </div>
        )}
        {invoice && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Invoice</dt>
            <dd>{String(invoice.invoiceNumber ?? invoice.invoice_number ?? '—')}</dd>
          </div>
        )}
        {Boolean(payment.confirmedAt || payment.confirmed_at) && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-muted">Confirmed</dt>
            <dd>{new Date(String(payment.confirmedAt ?? payment.confirmed_at)).toLocaleString()}</dd>
          </div>
        )}
      </dl>

      {events.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Events</h3>
          <ul className="space-y-1 text-sm">
            {events.map((ev) => {
              const e = ev as Record<string, unknown>
              return (
                <li key={String(e.id)} className="rounded-lg border border-border px-3 py-2">
                  <span className="font-medium">{String(e.event_type ?? e.eventType ?? 'event')}</span>
                  {Boolean(e.created_at || e.createdAt) && (
                    <span className="ml-2 text-xs text-text-muted">
                      {new Date(String(e.created_at ?? e.createdAt)).toLocaleString()}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {auditTrail.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Audit</h3>
          <ul className="space-y-1 text-sm">
            {auditTrail.map((row) => {
              const a = row as Record<string, unknown>
              return (
                <li key={String(a.id)} className="rounded-lg border border-border px-3 py-2">
                  <span className="font-medium">{String(a.action ?? '')}</span>
                  {Boolean(a.created_at || a.createdAt) && (
                    <span className="ml-2 text-xs text-text-muted">
                      {new Date(String(a.created_at ?? a.createdAt)).toLocaleString()}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
