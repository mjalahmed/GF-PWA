import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatMoney } from '../../lib/utils'
import { PRODUCT_ORDER_NEXT_STATUSES } from '../../types/orders'
import {
  listBusinessProductOrders,
  updateProductOrderStatus,
} from '../../services/api/orders'

export function BusinessOrdersPage() {
  const { businessId = '' } = useParams()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const ordersQuery = useQuery({
    queryKey: ['business-product-orders', businessId],
    queryFn: () => listBusinessProductOrders(businessId),
    enabled: Boolean(businessId),
  })

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateProductOrderStatus(businessId, orderId, status),
    onSuccess: () => {
      setMessage('Order status updated.')
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['business-product-orders', businessId] })
    },
    onError: (err: Error) => {
      setError(err.message)
      setMessage('')
    },
  })

  if (ordersQuery.isLoading) return <Spinner />

  const orders = ordersQuery.data ?? []

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Link to={`/business/garages/${businessId}`} className="text-sm text-primary">
          ← Garage
        </Link>
        <h2 className="text-xl font-semibold">Product orders</h2>
        <p className="text-sm text-text-muted">Fulfill pickup and delivery requests.</p>
        {error && <p className="text-sm text-error">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        {orders.length === 0 && (
          <p className="text-sm text-text-muted">No product orders yet.</p>
        )}

        <ul className="space-y-3">
          {orders.map((order) => {
            const next = PRODUCT_ORDER_NEXT_STATUSES[order.status] ?? []
            return (
              <li key={order.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-xs capitalize text-text-muted">
                      {String(order.fulfillmentMethod).replaceAll('_', ' ')}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-2 text-sm font-medium">
                  {formatMoney(order.grandTotal, order.currency)}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.productName} × {item.quantity}
                    </li>
                  ))}
                </ul>
                {order.deliveryAddress && (
                  <p className="mt-2 text-xs text-text-muted">Ship to: {order.deliveryAddress}</p>
                )}
                {next.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {next.map((status) => (
                      <Button
                        key={status}
                        className="text-xs"
                        loading={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ orderId: order.id, status })}
                      >
                        {status.replaceAll('_', ' ')}
                      </Button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </RequireGarageSetup>
  )
}
