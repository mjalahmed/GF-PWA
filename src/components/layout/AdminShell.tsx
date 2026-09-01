import { Outlet, NavLink } from 'react-router-dom'
import { PageHeader } from './PageHeader'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/applications', label: 'Applications' },
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/reviews', label: 'Reviews' },
]

export function AdminShell() {
  return (
    <div className="app-shell admin-shell">
      <PageHeader title="GarageFinder Admin" subtitle="Platform moderation view" />
      <nav className="audience-nav" aria-label="Admin navigation">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'active' : '')}>
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
  )
}
