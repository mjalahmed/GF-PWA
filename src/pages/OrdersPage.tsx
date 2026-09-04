import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDateLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { formatMoney } from '../lib/utils'
import { listProductOrders } from '../services/api/orders'

export function OrdersPage() {
  const { t, dateLocale } = useLocale()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['product-orders'],
    queryFn: () => listProductOrders(),
  })

  return (
    <div>
      <PageHeader title={t('orders.title')} />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title={t('orders.loadError')}
            actionLabel={t('common.retry')}
            onAction={() => refetch()}
          />
        )}
        {data?.length === 0 && (
          <EmptyState title={t('orders.empty')} description={t('orders.emptyDesc')} />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block rounded-2xl border border-border bg-surface p-4 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">{order.orderNumber}</h3>
                    <p className="text-sm text-text-muted capitalize">
                      {String(order.fulfillmentMethod).replaceAll('_', ' ')}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {formatMoney(order.grandTotal, order.currency)}
                  </span>
                  {order.createdAt && (
                    <span className="text-text-muted">
                      {formatDateLocalized(order.createdAt, dateLocale)}
                    </span>
                  )}
                </div>
                {order.items.length > 0 && (
                  <p className="mt-1 text-xs text-text-subtle line-clamp-1">
                    {order.items.map((i) => i.productName).join(', ')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
