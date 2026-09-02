import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { listAdminApplications } from '../../services/api/admin'

export function AdminApplicationsPage() {
  const query = useQuery({
    queryKey: ['admin-applications'],
    queryFn: async () => {
      const [submitted, underReview, changesRequested, approved] = await Promise.all([
        listAdminApplications({ status: 'submitted', pageSize: 50 }),
        listAdminApplications({ status: 'under_review', pageSize: 50 }),
        listAdminApplications({ status: 'changes_requested', pageSize: 50 }),
        listAdminApplications({ status: 'approved', pageSize: 20 }),
      ])
      const queue = [...submitted, ...underReview, ...changesRequested]
      return { queue, approved }
    },
  })

  if (query.isLoading) return <Spinner />

  const queue = query.data?.queue ?? []
  const approved = query.data?.approved ?? []

  return (
    <section className="mx-auto max-w-lg space-y-6 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">Application review</h2>
        <p className="mt-1 text-sm text-text-muted">Review documents, then approve or request changes.</p>
      </div>

      {query.isError && (
        <p className="text-sm text-error">
          {query.error instanceof Error ? query.error.message : 'Failed to load'}
        </p>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">Queue</h3>
        {queue.length === 0 ? (
          <p className="text-sm text-text-muted">No applications waiting.</p>
        ) : (
          <ul className="space-y-2">
            {queue.map((app) => (
              <li key={app.id}>
                <Link
                  to={`/admin/applications/${app.id}`}
                  className="block rounded-xl border border-border bg-surface p-4 no-underline hover:border-primary"
                >
                  <div className="flex justify-between gap-2">
                    <strong>{app.displayName}</strong>
                    <span className="text-xs capitalize text-text-muted">
                      {app.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">{app.legalName}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {approved.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Recently approved
          </h3>
          <ul className="space-y-2">
            {approved.map((app) => (
              <li key={app.id} className="rounded-xl border border-border bg-surface p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{app.displayName}</span>
                  {app.createdBusinessId && (
                    <Link
                      to={`/admin/businesses/${app.createdBusinessId}/setup`}
                      className="text-primary"
                    >
                      Configure
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
