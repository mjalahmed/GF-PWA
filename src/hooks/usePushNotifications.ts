import { useEffect } from 'react'
import { useAuth } from './useAuth'
import { registerPushSubscription } from '../services/api/notifications'

export function usePushNotifications() {
  const { session } = useAuth()

  useEffect(() => {
    if (!session || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    const run = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.ready
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          // VAPID public key can be set via VITE_VAPID_PUBLIC_KEY when backend push is configured
          const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
          if (!vapidKey) return
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          })
        }
        await registerPushSubscription(subscription)
      } catch {
        // Push is optional until VAPID keys are configured
      }
    }

    run()
  }, [session])
}
