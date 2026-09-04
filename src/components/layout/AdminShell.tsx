import { Outlet, NavLink } from 'react-router-dom'
import { RoleProtectedRoute } from '../ui/ProtectedRoute'
import { LanguageToggle } from '../../i18n/LanguageToggle'
import { useLocale } from '../../i18n/LocaleProvider'
import { PageHeader } from './PageHeader'

const ADMIN_ROLES = [
  'admin',
  'super_admin',
  'onboarding_officer',
  'dispute_officer',
  'content_moderator',
  'support_agent',
]

export function AdminShell() {
  const { t } = useLocale()

  const links = [
    { to: '/admin', label: t('admin.nav.dashboard'), end: true },
    { to: '/admin/applications', label: t('admin.nav.applications') },
    { to: '/admin/businesses', label: t('admin.nav.businesses') },
    { to: '/admin/users', label: t('admin.nav.users') },
    { to: '/admin/vehicles', label: t('admin.nav.vehicles') },
    { to: '/admin/appointments', label: t('admin.nav.appointments') },
    { to: '/admin/disputes', label: t('admin.nav.disputes') },
    { to: '/admin/reviews', label: t('admin.nav.reviews') },
    { to: '/admin/transactions', label: t('admin.nav.transactions') },
  ]

  return (
    <RoleProtectedRoute roles={ADMIN_ROLES}>
      <div className="app-shell admin-shell">
        <div className="border-b border-border bg-surface px-4 py-2">
          <div className="mx-auto flex max-w-lg justify-end">
            <LanguageToggle />
          </div>
        </div>
        <PageHeader brand title={t('admin.shellTitle')} subtitle={t('admin.shellSubtitle')} />
        <nav className="audience-nav" aria-label={t('admin.navAria')}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/" className="audience-nav__back">
            {t('admin.customerApp')}
          </NavLink>
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </RoleProtectedRoute>
  )
}
