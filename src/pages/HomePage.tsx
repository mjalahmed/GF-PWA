import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { GarageCard } from '../components/ui/GarageCard'
import { Spinner } from '../components/ui/Spinner'
import { searchBusinesses } from '../services/api/garages'

export function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['featured-garages'],
    queryFn: () => searchBusinesses({ sort: 'rating', pageSize: 6 }),
    enabled: true,
  })

  return (
    <div>
      <PageHeader title="GarageFinder" />
      <div className="mx-auto max-w-lg px-4 py-6">
        <section className="rounded-2xl bg-primary px-5 py-6 text-white">
          <h2 className="text-xl font-bold">Find trusted garages in Bahrain</h2>
          <p className="mt-2 text-sm text-white/90">
            Search workshops, compare ratings, and book services near you.
          </p>
          <Link
            to="/search"
            className="mt-4 inline-flex touch-target items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-white/90"
          >
            Search garages
          </Link>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Top rated</h2>
            <Link to="/search" className="text-sm font-medium text-primary">
              See all
            </Link>
          </div>

          {isLoading && <Spinner />}
          {error && (
            <EmptyState
              title="Could not load garages"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={() => window.location.reload()}
            />
          )}
          {data && data.items.length === 0 && (
            <EmptyState title="No garages yet" description="Check back soon for featured listings." />
          )}
          {data && data.items.length > 0 && (
            <div className="space-y-3">
              {data.items.map((garage) => (
                <GarageCard key={garage.id} garage={garage} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
