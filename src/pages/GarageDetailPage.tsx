import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StarRating } from '../components/ui/StarRating'
import { useGeolocation } from '../hooks/useGeolocation'
import { formatDistance, formatRating, primaryBranch } from '../lib/utils'
import { getBusinessBySlug } from '../services/api/garages'

export function GarageDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { state: geo } = useGeolocation()

  const coords =
    geo.status === 'granted' ? { latitude: geo.latitude, longitude: geo.longitude } : undefined

  const { data: garage, isLoading, error } = useQuery({
    queryKey: ['garage', slug, coords?.latitude, coords?.longitude],
    queryFn: () => getBusinessBySlug(slug!, coords),
    enabled: !!slug,
  })

  if (isLoading) return <Spinner />
  if (error || !garage) {
    return (
      <div>
        <PageHeader title="Garage" backTo="/search" />
        <EmptyState
          title="Garage not found"
          description="This listing may have been removed."
          actionLabel="Back to search"
          onAction={() => (window.location.href = '/search')}
        />
      </div>
    )
  }

  const branch = primaryBranch(garage)

  return (
    <div>
      <PageHeader title={garage.displayName} backTo="/search" />
      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-2xl font-bold text-primary">
            {garage.displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <StarRating rating={garage.averageRating} />
              <span className="text-sm text-text-muted">
                {formatRating(garage.averageRating, garage.ratingCount)}
              </span>
            </div>
            {garage.openingState && (
              <p className={garage.openingState.isOpen ? 'mt-1 text-sm text-success' : 'mt-1 text-sm text-text-subtle'}>
                {garage.openingState.isOpen ? 'Open now' : 'Closed'}
              </p>
            )}
            {garage.distanceKm != null && (
              <p className="mt-1 text-sm text-text-muted">{formatDistance(garage.distanceKm)}</p>
            )}
          </div>
        </div>

        {garage.description && (
          <p className="mt-6 text-sm leading-relaxed text-text-secondary">{garage.description}</p>
        )}

        {branch && (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
            <h2 className="font-semibold text-text-primary">Location</h2>
            <p className="mt-2 text-sm text-text-secondary">{branch.addressLine}</p>
            {(branch.area || branch.city) && (
              <p className="text-sm text-text-muted">
                {[branch.area, branch.city].filter(Boolean).join(', ')}
              </p>
            )}
            {branch.phone && (
              <a href={`tel:${branch.phone}`} className="mt-3 inline-block text-sm font-medium text-primary">
                {branch.phone}
              </a>
            )}
          </section>
        )}

        <section className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <h2 className="font-semibold text-text-primary">Services & products</h2>
          <p className="mt-2 text-sm text-text-muted">
            {garage.serviceCount} services · {garage.productCount} products
          </p>
        </section>

        {garage.branches.length > 1 && (
          <section className="mt-4">
            <h2 className="mb-3 font-semibold text-text-primary">All branches</h2>
            <div className="space-y-2">
              {garage.branches.map((b) => (
                <div key={b.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-text-muted">{b.addressLine}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Link
          to="/bookings"
          className="mt-8 block w-full rounded-xl bg-primary py-3 text-center text-sm font-semibold text-white"
        >
          View my bookings
        </Link>
      </div>
    </div>
  )
}
