import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { useLocale } from '../../i18n/LocaleProvider'
import { Button } from '../ui/Button'

export function InstallAppSection() {
  const { t } = useLocale()
  const { canOfferInstall, isIOS, hasNativePrompt, install, showInstallBannerAgain } = useInstallPrompt()

  if (!canOfferInstall) return null

  return (
    <section className="rounded-2xl border border-primary/25 bg-primary-light/40 p-5">
      <div className="flex items-start gap-3">
        <img src="/icons/icon-192.png" alt="" className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-text-primary">{t('pwa.installLaterTitle')}</h2>
          <p className="mt-1 text-xs text-text-muted">
            {isIOS && !hasNativePrompt ? t('pwa.installIos') : t('pwa.installLaterDesc')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {hasNativePrompt && (
              <Button className="px-3 py-1.5 text-xs" onClick={() => install()}>
                {t('pwa.install')}
              </Button>
            )}
            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={showInstallBannerAgain}>
              {t('pwa.showInstallBanner')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
