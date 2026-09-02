import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { registerPushSubscription } from '../services/api/notifications'

/**
 * Registers web push when the user has a session and VAPID is configured.
 * Uses Supabase session directly so it stays safe under Vite HMR
 * (AuthContext can get duplicated across hot reloads).
 */
export function usePushNotifications() {
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setHasSession(!!data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!hasSession || !('serviceWorker' in navigator) || !('PushManager' in window)) return

    const run = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const registration = await navigator.serviceWorker.ready
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
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

    void run()
  }, [hasSession])
}
