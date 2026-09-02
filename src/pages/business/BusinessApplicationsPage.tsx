import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { listBusinessApplications } from '../../services/api/business'

export function BusinessApplicationsPage() {
  const query = useQuery({
    queryKey: ['my-business-applications'],
    queryFn: () => listBusinessApplications(),
  })

  if (query.isLoading) return <Spinner />

  const apps = query.data ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Garage applications</h2>
          <p className="mt-1 text-sm text-text-muted">
            Apply to list your Automotive Service Provider on GarageFinder.
          </p>
        </div>
        <Link to="/business/applications/new">
          <Button>Apply</Button>
        </Link>
      </div>

      {query.isError && (
        <p className="text-sm text-error">
          {query.error instanceof Error ? query.error.message : 'Failed to load applications'}
        </p>
      )}

      {apps.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
          No applications yet. Start one to onboard your garage.
        </p>
      ) : (
        <ul className="space-y-2">
          {apps.map((app) => (
            <li key={app.id}>
              <Link
                to={`/business/applications/${app.id}`}
                className="block rounded-xl border border-border bg-surface p-4 no-underline hover:border-primary"
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-text-primary">{app.displayName}</strong>
                  <span className="text-xs capitalize text-text-muted">{app.status.replaceAll('_', ' ')}</span>
                </div>
                <p className="mt-1 text-sm text-text-muted">{app.legalName}</p>
                {app.status === 'approved' && app.createdBusinessId && (
                  <p className="mt-2 text-xs text-success">Approved — open Setup to go live</p>
                )}
                {app.status === 'changes_requested' && app.changesRequestedReason && (
                  <p className="mt-2 text-xs text-warning">{app.changesRequestedReason}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
