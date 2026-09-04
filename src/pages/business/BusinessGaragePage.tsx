import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { fetchGarageSetupChecklist } from '../../lib/fetchGarageSetup'
import { getBusinessDashboard, listMyBusinessMemberships } from '../../services/api/business'

export function BusinessGaragePage() {
  const { businessId = '' } = useParams()

  const membershipQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })
  const businessQuery = useQuery({
    queryKey: ['business-profile', businessId],
    queryFn: () => getBusinessDashboard(businessId),
    enabled: Boolean(businessId),
  })
  const setupQuery = useQuery({
    queryKey: ['garage-setup', businessId],
    queryFn: () => fetchGarageSetupChecklist(businessId),
    enabled: Boolean(businessId),
  })

  if (membershipQuery.isLoading || businessQuery.isLoading || setupQuery.isLoading) {
    return <Spinner />
  }

  const membership = membershipQuery.data?.find((m) => m.businessId === businessId) ?? null
  if (!membership) {
    return (
      <section className="space-y-3 px-4 py-4">
        <h2>Garage not found</h2>
        <p>You do not have access to this business.</p>
        <Link to="/business">Back to dashboard</Link>
      </section>
    )
  }

  const businessName = membership.business.displayName || businessQuery.data?.displayName || businessId
  const checklist = setupQuery.data
  const setupIncomplete = checklist && !checklist.complete

  return (
    <section className="mx-auto max-w-lg space-y-6 px-4 py-4">
      {setupIncomplete && (
        <div
          role="status"
          className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text-primary"
        >
          Profile setup incomplete — add hours and services when ready.{' '}
          <Link
            to={`/business/garages/${businessId}/setup`}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Continue setup
          </Link>
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold">{businessName}</h2>
        <p className="text-sm text-text-muted">Your role: {membership.role}</p>
        {checklist?.complete && (
          <p className="mt-1 text-xs text-success">Setup complete — customers can discover and book.</p>
        )}
      </div>

      <div className="grid gap-3">
        {(
          [
            {
              to: `/business/garages/${businessId}/setup`,
              title: 'Garage setup',
              desc: 'Profile, location pin, hours, services, and bookings.',
            },
            {
              to: `/business/garages/${businessId}/products`,
              title: 'Products',
              desc: 'Parts and products shown on your public garage page.',
            },
            {
              to: `/business/appointments?businessId=${businessId}`,
              title: 'Appointments',
              desc: 'Confirm, start, and complete bookings.',
            },
            {
              to: `/business/quotations?businessId=${businessId}`,
              title: 'Quotations',
              desc: 'Issue and manage customer quotes.',
            },
            {
              to: `/business/invoices?businessId=${businessId}`,
              title: 'Invoices',
              desc: 'Issue invoices and record cash payments.',
            },
            {
              to: `/business/garages/${businessId}/team`,
              title: 'Team & invitations',
              desc: 'Invite staff by email.',
            },
          ] as const
        ).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-xl border border-border bg-surface p-4 no-underline transition-colors hover:border-primary"
          >
            <strong className="text-text-primary">{item.title}</strong>
            <p className="mt-1 text-sm text-text-muted">{item.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
