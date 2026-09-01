import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { listMyBusinessMemberships } from '../../services/api/business'

export function BusinessDashboardPage() {
  const [memberships, setMemberships] = useState<Awaited<ReturnType<typeof listMyBusinessMemberships>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listMyBusinessMemberships()
      .then(setMemberships)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load memberships'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <h2 className="text-xl font-semibold">Your garages</h2>
      {error && <p className="text-sm text-error">{error}</p>}
      {memberships.length === 0 ? (
        <p>
          No active business memberships yet.{' '}
          <Link to="/business/applications">Start a business application</Link>.
        </p>
      ) : (
        <ul className="space-y-3">
          {memberships.map((m) => (
            <li key={m.membershipId}>
              <Link
                to={`/business/garages/${m.businessId}`}
                className="block rounded-xl border border-border bg-surface p-4 no-underline hover:border-primary"
              >
                <strong className="text-text-primary">{m.business.displayName}</strong>
                <p className="mt-1 text-sm text-text-muted">
                  {m.role} · {m.business.verificationStatus}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-text-muted">
        To test email: open a garage → Team & invitations → send an invite to a real inbox.
      </p>
    </section>
  )
}
