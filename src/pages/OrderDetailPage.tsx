import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDateLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { formatMoney } from '../lib/utils'
import { getProductOrder } from '../services/api/orders'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, dateLocale } = useLocale()

  const orderQuery = useQuery({
    queryKey: ['product-order', id],
    queryFn: () => getProductOrder(id!),
    enabled: !!id,
  })

  if (orderQuery.isLoading) return <Spinner />

  const order = orderQuery.data
  if (!order) {
    return (
      <div>
        <PageHeader title={t('orders.detail')} backTo="/orders" />
        <EmptyState
          title={t('orders.notFound')}
          actionLabel={t('orders.back')}
          onAction={() => navigate('/orders')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={order.orderNumber || t('orders.detail')} backTo="/orders" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <StatusBadge status={order.status} />
          <span className="text-sm capitalize text-text-muted">
            {String(order.fulfillmentMethod).replaceAll('_', ' ')}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-2xl font-semibold">
            {formatMoney(order.grandTotal, order.currency)}
          </p>
          {order.createdAt && (
            <p className="mt-1 text-sm text-text-muted">
              {formatDateLocalized(order.createdAt, dateLocale)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">{t('orders.items')}</h3>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              >
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-medium">
                  {formatMoney(item.lineTotal, order.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {order.deliveryAddress && (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="text-text-muted">{t('orders.deliveryAddress')}</p>
            <p className="mt-1">{order.deliveryAddress}</p>
          </div>
        )}

        {order.customerNotes && (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="text-text-muted">{t('orders.notes')}</p>
            <p className="mt-1">{order.customerNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
