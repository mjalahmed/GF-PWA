import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getUnreadNotificationCount } from '../../services/api/notifications'
import { useAuth } from '../../hooks/useAuth'

export function NotificationBell() {
  const { session } = useAuth()
  const { data: count = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadNotificationCount,
    enabled: !!session,
    refetchInterval: 60_000,
  })

  if (!session) return null

  return (
    <Link
      to="/notifications"
      className="relative touch-target flex items-center justify-center rounded-full p-2 text-primary"
      aria-label="Notifications"
    >
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {count > 0 && (
        <span className="absolute end-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
