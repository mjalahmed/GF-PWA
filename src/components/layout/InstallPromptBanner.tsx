import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { Button } from '../ui/Button'

export function InstallPromptBanner() {
  const { canPrompt, isIOS, hasNativePrompt, install, dismiss } = useInstallPrompt()

  if (!canPrompt) return null

  return (
    <div className="border-b border-primary/20 bg-primary-light px-4 py-3">
      <div className="mx-auto flex max-w-lg items-start gap-3">
        <img src="/icons/icon-192.png" alt="" className="size-10 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">Install GarageFinder</p>
          <p className="text-xs text-text-muted">
            {isIOS && !hasNativePrompt
              ? 'Tap Share, then "Add to Home Screen" for quick access.'
              : 'Add to your home screen for a faster, app-like experience.'}
          </p>
          <div className="mt-2 flex gap-2">
            {hasNativePrompt && (
              <Button className="px-3 py-1.5 text-xs" onClick={install}>
                Install
              </Button>
            )}
            <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
