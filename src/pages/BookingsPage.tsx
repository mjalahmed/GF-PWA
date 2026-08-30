import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { formatDate, formatStatus } from '../lib/utils'
import { listAppointments } from '../services/api/bookings'

export function BookingsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => listAppointments(),
  })

  return (
    <div>
      <PageHeader title="My bookings" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title="Could not load bookings"
            description="Please try again."
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        )}
        {data && data.length === 0 && (
          <EmptyState
            title="No bookings yet"
            description="Find a garage and book a service to see appointments here."
            actionLabel="Search garages"
            onAction={() => (window.location.href = '/search')}
            icon="📅"
          />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((appt) => (
              <article key={appt.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-text-primary">
                      {appt.businessName ?? 'Garage appointment'}
                    </h3>
                    {appt.branchName && (
                      <p className="text-sm text-text-muted">{appt.branchName}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
                    {formatStatus(appt.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-text-secondary">{formatDate(appt.scheduledStart)}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}