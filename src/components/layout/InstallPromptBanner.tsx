import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { useLocale } from '../../i18n/LocaleProvider'
import { Button } from '../ui/Button'

export function InstallPromptBanner() {
  const { canPrompt, isIOS, hasNativePrompt, install, dismiss } = useInstallPrompt()
  const { t } = useLocale()

  if (!canPrompt) return null

  return (
    <div className="border-b border-primary/20 bg-primary-light px-4 py-3">
      <div className="mx-auto flex max-w-lg items-start gap-3">
        <img src="/icons/icon-192.png" alt="" className="size-10 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">{t('pwa.installTitle')}</p>
          <p className="text-xs text-text-muted">
            {isIOS && !hasNativePrompt ? t('pwa.installIos') : t('pwa.installDefault')}
          </p>
          <div className="mt-2 flex gap-2">
            {hasNativePrompt && (
              <Button className="px-3 py-1.5 text-xs" onClick={install}>
                {t('pwa.install')}
              </Button>
            )}
            <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={dismiss}>
              {t('pwa.notNow')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
