import { Outlet, NavLink } from 'react-router-dom'
import { RoleProtectedRoute } from '../ui/ProtectedRoute'
import { PageHeader } from './PageHeader'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/applications', label: 'Applications' },
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/reviews', label: 'Reviews' },
]

const ADMIN_ROLES = [
  'admin',
  'super_admin',
  'onboarding_officer',
  'dispute_officer',
  'content_moderator',
  'support_agent',
]

export function AdminShell() {
  return (
    <RoleProtectedRoute roles={ADMIN_ROLES}>
      <div className="app-shell admin-shell">
        <PageHeader title="GarageFinder Admin" subtitle="Platform moderation view" />
        <nav className="audience-nav" aria-label="Admin navigation">
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
            Customer app
          </NavLink>
        </nav>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </RoleProtectedRoute>
  )
}
