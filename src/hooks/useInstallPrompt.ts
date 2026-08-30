import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa-install-dismissed') === '1')
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !('MSStream' in window))
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') setDeferred(null)
  }

  const dismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1')
    setDismissed(true)
  }

  const canPrompt = !isStandalone && !dismissed && (deferred != null || isIOS)

  return { canPrompt, isIOS, isStandalone, install, dismiss, hasNativePrompt: deferred != null }
}
