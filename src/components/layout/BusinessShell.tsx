import { useQuery } from '@tanstack/react-query'
import { Outlet, NavLink } from 'react-router-dom'
import { listMyBusinessMemberships } from '../../services/api/business'
import { ProtectedRoute } from '../ui/ProtectedRoute'
import { PageHeader } from './PageHeader'
import { Spinner } from '../ui/Spinner'

const applicantLinks = [{ to: '/business/applications', label: 'Applications' }] as const

const portalLinks = [
  { to: '/business', label: 'Dashboard', end: true },
  { to: '/business/appointments', label: 'Appointments' },
  { to: '/business/quotations', label: 'Quotes' },
  { to: '/business/invoices', label: 'Invoices' },
  { to: '/business/applications', label: 'Applications' },
] as const

export function BusinessShell() {
  const membershipsQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })

  const hasPortalAccess = (membershipsQuery.data?.length ?? 0) > 0
  const links = hasPortalAccess ? portalLinks : applicantLinks

  return (
    <div className="app-shell business-shell">
      <PageHeader
        brand
        title={hasPortalAccess ? 'Garage Portal' : 'Apply as a garage'}
        subtitle={
          hasPortalAccess
            ? 'Business operator view'
            : 'Submit an application to unlock the garage dashboard'
        }
      />
      <nav className="audience-nav" aria-label="Business navigation">
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
          Customer app
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
