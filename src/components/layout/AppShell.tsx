import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { InstallPromptBanner } from './InstallPromptBanner'
import { OfflineBanner } from './OfflineBanner'
import { UpdatePrompt } from './UpdatePrompt'
import { isConfigured } from '../../lib/env'
import { useLocale } from '../../i18n/LocaleProvider'

export function AppShell() {
  const { pathname } = useLocation()
  const { t } = useLocale()
  const hideNav =
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/garages/')

  return (
    <div className="min-h-dvh bg-background">
      <OfflineBanner />
      {!isConfigured && (
        <div className="bg-warning/10 px-4 py-2 text-center text-xs text-warning">
          {t('pwa.configWarning')}
        </div>
      )}
      <InstallPromptBanner />
      <main className={hideNav ? 'min-h-dvh' : 'min-h-dvh pb-20'}>
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
      <UpdatePrompt />
    </div>
  )
}
