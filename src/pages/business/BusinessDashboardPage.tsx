import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProtectedRoute } from '../../components/ui/ProtectedRoute'
import { Spinner } from '../../components/ui/Spinner'
import { listMyBusinessMemberships } from '../../services/api/business'

export function BusinessDashboardPage() {
  const [memberships, setMemberships] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMyBusinessMemberships()
      .then(setMemberships)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <ProtectedRoute>
      <section>
        <h2>Your garages</h2>
        {memberships.length === 0 ? (
          <p>
            No active business memberships yet.{' '}
            <Link to="/business/applications">Start a business application</Link>.
          </p>
        ) : (
          <ul>
            {memberships.map((m) => (
              <li key={String(m.businessId ?? m.id)}>
                <Link to={`/business/garages/${m.businessId}`}>{String(m.businessName ?? m.businessId)}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ProtectedRoute>
  )
}
