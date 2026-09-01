import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pwa-install-dismissed'

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIosDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notify()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function useInstallPrompt() {
  const [, tick] = useState(0)

  useEffect(() => {
    const listener = () => tick((n) => n + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const dismissed = readDismissed()
  const isStandalone = isStandaloneMode()
  const isIOS = isIosDevice()
  const hasNativePrompt = deferredPrompt != null

  const install = async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      deferredPrompt = null
      notify()
    }
    return outcome === 'accepted'
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
    notify()
  }

  const showInstallBannerAgain = () => {
    try {
      localStorage.removeItem(DISMISS_KEY)
    } catch {
      // ignore
    }
    notify()
  }

  const canPrompt = !isStandalone && !dismissed && (hasNativePrompt || isIOS)
  const canOfferInstall = !isStandalone

  return {
    canPrompt,
    canOfferInstall,
    isIOS,
    isStandalone,
    hasNativePrompt,
    install,
    dismiss,
    showInstallBannerAgain,
  }
}
