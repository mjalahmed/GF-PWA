import { useQuery } from '@tanstack/react-query'
import { Outlet, NavLink } from 'react-router-dom'
import { listMyBusinessMemberships } from '../../services/api/business'
import { LanguageToggle } from '../../i18n/LanguageToggle'
import { useLocale } from '../../i18n/LocaleProvider'
import { ProtectedRoute } from '../ui/ProtectedRoute'
import { PageHeader } from './PageHeader'
import { Spinner } from '../ui/Spinner'

export function BusinessShell() {
  const { t } = useLocale()
  const membershipsQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })

  const hasPortalAccess = (membershipsQuery.data?.length ?? 0) > 0
  const applicantLinks = [{ to: '/business/applications', label: t('biz.nav.applications') }] as const
  const portalLinks = [
    { to: '/business', label: t('biz.nav.dashboard'), end: true },
    { to: '/business/appointments', label: t('biz.nav.appointments') },
    { to: '/business/quotations', label: t('biz.nav.quotations') },
    { to: '/business/invoices', label: t('biz.nav.invoices') },
    { to: '/business/applications', label: t('biz.nav.applications') },
  ] as const
  const links = hasPortalAccess ? portalLinks : applicantLinks

  return (
    <div className="app-shell business-shell">
      <div className="border-b border-border bg-surface px-4 py-2">
        <div className="mx-auto flex max-w-lg justify-end">
          <LanguageToggle />
        </div>
      </div>
      <PageHeader
        brand
        title={hasPortalAccess ? t('biz.shellTitle') : t('biz.shellApplyTitle')}
        subtitle={hasPortalAccess ? t('biz.shellSubtitle') : t('biz.shellApplySubtitle')}
      />
      <nav className="audience-nav" aria-label={t('biz.navAria')}>
        {membershipsQuery.isLoading ? (
          <Spinner />
        ) : (
          links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={'end' in link ? link.end : false}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {link.label}
            </NavLink>
          ))
        )}
        <NavLink to="/" className="audience-nav__back">
          {t('biz.customerApp')}
        </NavLink>
      </nav>
      <main className="app-main">
        <ProtectedRoute>
          <Outlet />
        </ProtectedRoute>
      </main>
    </div>
  )
}
