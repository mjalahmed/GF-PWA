import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { useLocale } from '../i18n/LocaleProvider'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../services/api/notifications'

function notificationLink(n: AppNotification): string | null {
  if (!n.entityType || !n.entityId) return null
  const map: Record<string, string> = {
    appointment: `/appointments/${n.entityId}`,
    quotation: `/quotations/${n.entityId}`,
    invoice: `/invoices/${n.entityId}`,
    review: `/reviews/${n.entityId}`,
    dispute: `/disputes/${n.entityId}`,
  }
  return map[n.entityType] ?? null
}

export function NotificationsPage() {
  const { t } = useLocale()
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications(),
  })

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        backTo="/profile"
        action={
          items.some((n) => !n.readAt) ? (
            <Button variant="secondary" loading={markAll.isPending} onClick={() => markAll.mutate()}>
              {t('notifications.markAllRead')}
            </Button>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState title={t('notifications.empty')} />
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const href = notificationLink(n)
              const inner = (
                <div
                  className={`rounded-2xl border p-4 ${n.readAt ? 'border-border bg-surface' : 'border-primary/30 bg-primary-light/30'}`}
                >
                  <p className="font-medium text-text-primary">{n.title}</p>
                  <p className="mt-1 text-sm text-text-muted">{n.body}</p>
                  <p className="mt-2 text-xs text-text-subtle">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              )
              return (
                <li key={n.id}>
                  {href ? (
                    <Link
                      to={href}
                      onClick={() => {
                        if (!n.readAt) markOne.mutate(n.id)
                      }}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="w-full text-start"
                      onClick={() => {
                        if (!n.readAt) markOne.mutate(n.id)
                      }}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
