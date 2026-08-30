import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) return null

  return (
    <div
      role="status"
      className="safe-top fixed inset-x-0 top-0 z-50 bg-warning px-4 py-2 text-center text-sm font-medium text-white"
    >
      You&apos;re offline — showing cached content where available
    </div>
  )
}
