import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { GarageFinderLogo } from '../components/brand/GarageFinderLogo'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../i18n/LocaleProvider'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '../services/api/notifications'

function notificationLink(n: AppNotification, roles: string[]): string | null {
  if (!n.entityType || !n.entityId) return null
  const isAdmin = roles.some((r) =>
    ['admin', 'super_admin', 'onboarding_officer', 'dispute_officer', 'content_moderator'].includes(
      r,
    ),
  )
  const isBusiness = roles.some((r) =>
    ['business_owner', 'owner', 'manager', 'service_advisor', 'mechanic', 'cashier', 'staff'].includes(
      r,
    ),
  )

  if (isAdmin) {
    if (n.entityType === 'dispute') return `/admin/disputes`
    if (n.entityType === 'review') return `/admin/reviews`
    if (n.entityType === 'application' || n.entityType === 'business_application') {
      return `/admin/applications/${n.entityId}`
    }
  }

  if (isBusiness) {
    if (n.entityType === 'appointment') {
      return `/business/appointments/${n.entityId}`
    }
    if (n.entityType === 'quotation') return `/business/quotations`
    if (n.entityType === 'invoice') return `/business/invoices`
  }

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
  const { roles } = useAuth()
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
        brand
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
          <EmptyState
            title={t('notifications.empty')}
            description={t('notifications.emptyDesc')}
            icon={<GarageFinderLogo height={64} className="opacity-80" />}
          />
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const href = notificationLink(n, roles)
              const unread = !n.readAt
              const inner = (
                <div
                  className={`rounded-2xl border p-4 ${
                    unread
                      ? 'border-primary bg-primary-light/40 shadow-sm'
                      : 'border-border bg-surface'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-text-primary ${unread ? 'font-semibold' : 'font-medium'}`}>
                      {n.title}
                    </p>
                    {unread && (
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                        {t('notifications.unread')}
                      </span>
                    )}
                  </div>
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
