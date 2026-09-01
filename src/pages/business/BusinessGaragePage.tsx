import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { getBusinessDashboard, listMyBusinessMemberships } from '../../services/api/business'
import type { BusinessMembership } from '../../types/business'

export function BusinessGaragePage() {
  const { businessId = '' } = useParams()
  const [membership, setMembership] = useState<BusinessMembership | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!businessId) return
    Promise.all([listMyBusinessMemberships(), getBusinessDashboard(businessId)])
      .then(([memberships, business]) => {
        const match = memberships.find((m) => m.businessId === businessId) ?? null
        setMembership(match)
        setBusinessName(
          match?.business.displayName ??
            String((business as { displayName?: string }).displayName ?? businessId),
        )
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load garage'))
      .finally(() => setLoading(false))
  }, [businessId])

  if (loading) return <Spinner />
  if (error) return <p className="text-error">{error}</p>
  if (!membership) {
    return (
      <section className="space-y-3">
        <h2>Garage not found</h2>
        <p>You do not have access to this business.</p>
        <Link to="/business">Back to dashboard</Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-lg space-y-6 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">{businessName}</h2>
        <p className="text-sm text-text-muted">Your role: {membership.role}</p>
      </div>

      <div className="grid gap-3">
        <Link
          to={`/business/garages/${businessId}/team`}
          className="rounded-xl border border-border bg-surface p-4 no-underline transition-colors hover:border-primary"
        >
          <strong className="text-text-primary">Team & invitations</strong>
          <p className="mt-1 text-sm text-text-muted">
            Invite staff by email — triggers GarageFinder transactional mail.
          </p>
        </Link>
        <Link
          to={`/business/appointments?businessId=${businessId}`}
          className="rounded-xl border border-border bg-surface p-4 no-underline transition-colors hover:border-primary"
        >
          <strong className="text-text-primary">Appointments</strong>
          <p className="mt-1 text-sm text-text-muted">Manage bookings for this garage.</p>
        </Link>
      </div>
    </section>
  )
}
