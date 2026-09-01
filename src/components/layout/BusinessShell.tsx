import { Outlet, NavLink } from 'react-router-dom'
import { PageHeader } from './PageHeader'

const links = [
  { to: '/business', label: 'Dashboard', end: true },
  { to: '/business/appointments', label: 'Appointments' },
  { to: '/business/applications', label: 'Applications' },
]

export function BusinessShell() {
  return (
    <div className="app-shell business-shell">
      <PageHeader title="Garage Portal" subtitle="Business operator view" />
      <nav className="audience-nav" aria-label="Business navigation">
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
