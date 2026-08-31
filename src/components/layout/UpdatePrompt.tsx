import { useRegisterSW } from 'virtual:pwa-register/react'
import { useLocale } from '../../i18n/LocaleProvider'
import { Button } from '../ui/Button'

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const { t } = useLocale()

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-lg rounded-2xl border border-border bg-surface p-4 shadow-lg safe-bottom">
      <p className="text-sm font-semibold text-text-primary">{t('pwa.updateTitle')}</p>
      <p className="mt-1 text-xs text-text-muted">{t('pwa.updateDesc')}</p>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1 text-sm" onClick={() => updateServiceWorker(true)}>
          {t('pwa.updateNow')}
        </Button>
        <Button variant="secondary" className="flex-1 text-sm" onClick={() => setNeedRefresh(false)}>
          {t('pwa.later')}
        </Button>
      </div>
    </div>
  )
}
