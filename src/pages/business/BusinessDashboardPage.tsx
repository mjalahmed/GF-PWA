import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { fetchGarageSetupChecklist } from '../../lib/fetchGarageSetup'
import { listMyBusinessMemberships } from '../../services/api/business'

function GarageRow({
  businessId,
  displayName,
  role,
  verificationStatus,
}: {
  businessId: string
  displayName: string
  role: string
  verificationStatus: string
}) {
  const setupQuery = useQuery({
    queryKey: ['garage-setup', businessId],
    queryFn: () => fetchGarageSetupChecklist(businessId),
  })

  const incomplete = setupQuery.data ? !setupQuery.data.complete : false
  const to = incomplete
    ? `/business/garages/${businessId}/setup`
    : `/business/garages/${businessId}`

  return (
    <li>
      <Link
        to={to}
        className="block rounded-xl border border-border bg-surface p-4 no-underline hover:border-primary"
      >
        <div className="flex items-start justify-between gap-2">
          <strong className="text-text-primary">{displayName}</strong>
          {incomplete && (
            <span className="shrink-0 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning">
              Setup required
            </span>
          )}
          {setupQuery.data?.complete && (
            <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              Live
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-text-muted">
          {role} · {verificationStatus}
          {incomplete ? ' · finish setup to go live' : ''}
        </p>
      </Link>
    </li>
  )
}

export function BusinessDashboardPage() {
  const membershipsQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })

  if (membershipsQuery.isLoading) return <Spinner />

  const memberships = membershipsQuery.data ?? []
  if (memberships.length === 0) {
    return <Navigate to="/business/applications" replace />
  }

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <h2 className="text-xl font-semibold">Your garages</h2>
      {membershipsQuery.isError && (
        <p className="text-sm text-error">
          {membershipsQuery.error instanceof Error
            ? membershipsQuery.error.message
            : 'Failed to load memberships'}
        </p>
      )}
      <ul className="space-y-3">
        {memberships.map((m) => (
          <GarageRow
            key={m.membershipId}
            businessId={m.businessId}
            displayName={m.business.displayName}
            role={m.role}
            verificationStatus={m.business.verificationStatus}
          />
        ))}
      </ul>
      <p className="text-sm text-text-muted">
        Incomplete garages open Setup until location, hours, services, and bookings are ready.
      </p>
    </section>
  )
}
