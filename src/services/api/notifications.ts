import { apiClient } from './client'
import { platformPaths } from './paths'

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string
  entityType: string | null
  entityId: string | null
  metadata: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

function mapNotification(raw: Record<string, unknown>): AppNotification {
  return {
    id: String(raw.id),
    type: String(raw.type),
    title: String(raw.title),
    body: String(raw.body),
    entityType: (raw.entityType ?? raw.entity_type ?? null) as string | null,
    entityId: (raw.entityId ?? raw.entity_id ?? null) as string | null,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
    readAt: (raw.readAt ?? raw.read_at ?? null) as string | null,
    createdAt: String(raw.createdAt ?? raw.created_at ?? ''),
  }
}

export async function listNotifications(unreadOnly = false): Promise<AppNotification[]> {
  const q = unreadOnly ? '?unread=true' : ''
  const envelope = await apiClient.get(
    `${platformPaths.notifications}${q}`,
    (json) => json as Record<string, unknown>[],
  )
  return (envelope.data ?? []).map((row) => mapNotification(row as Record<string, unknown>))
}

export async function getUnreadNotificationCount(): Promise<number> {
  const envelope = await apiClient.get(platformPaths.notificationUnreadCount, (json) =>
    json as Record<string, unknown>,
  )
  return Number(envelope.data?.count ?? 0)
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(platformPaths.notificationRead(id), {}, () => ({}))
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post(platformPaths.notificationsReadAll, {}, () => ({}))
}

export async function registerPushSubscription(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return
  await apiClient.post(
    platformPaths.pushSubscriptions,
    {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      userAgent: navigator.userAgent,
    },
    () => ({}),
  )
}
