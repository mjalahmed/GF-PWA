import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { GarageCard } from '../components/ui/GarageCard'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { vehicleLabel } from '../lib/utils'
import { listServiceCategories } from '../services/api/catalog'
import { listFavorites } from '../services/api/favorites'
import { searchBusinesses } from '../services/api/garages'
import { listVehicles } from '../services/api/vehicles'

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <Link to={to} className="text-sm font-medium text-primary">
        See all
      </Link>
    </div>
  )
}

export function HomePage() {
  const { session } = useAuth()

  const categoriesQuery = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => listServiceCategories(),
  })

  const featuredQuery = useQuery({
    queryKey: ['featured-garages'],
    queryFn: () => searchBusinesses({ sort: 'rating', pageSize: 6 }),
  })

  const newestQuery = useQuery({
    queryKey: ['newest-garages'],
    queryFn: () => searchBusinesses({ sort: 'newest', pageSize: 6 }),
  })

  const favoritesQuery = useQuery({
    queryKey: ['favorites-preview'],
    queryFn: () => listFavorites(),
    enabled: !!session,
  })

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles(),
    enabled: !!session,
  })

  const defaultVehicle = vehiclesQuery.data?.find((v) => v.isDefault) ?? vehiclesQuery.data?.[0]
  const favoritePreview = favoritesQuery.data?.slice(0, 3) ?? []

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

        {defaultVehicle && (
          <Link
            to={`/vehicles/${defaultVehicle.id}`}
            className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
          >
            <span className="text-lg" aria-hidden>
              🚗
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary">{vehicleLabel(defaultVehicle)}</p>
              {defaultVehicle.plateNumber && (
                <p className="text-text-muted">{defaultVehicle.plateNumber}</p>
              )}
            </div>
            <span className="text-xs font-medium text-primary">Default</span>
          </Link>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-text-primary">Browse by service</h2>
          {categoriesQuery.isLoading && <Spinner className="py-6" />}
          {categoriesQuery.data && categoriesQuery.data.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categoriesQuery.data.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/search?serviceCategory=${cat.id}`}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary hover:border-primary hover:text-primary"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <SectionHeader title="Top rated" to="/search?sort=rating" />
          {featuredQuery.isLoading && <Spinner />}
          {featuredQuery.error && (
            <EmptyState
              title="Could not load garages"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={() => featuredQuery.refetch()}
            />
          )}
          {featuredQuery.data?.items.length === 0 && (
            <EmptyState title="No garages yet" description="Check back soon for featured listings." />
          )}
          {featuredQuery.data && featuredQuery.data.items.length > 0 && (
            <div className="space-y-3">
              {featuredQuery.data.items.map((garage) => (
                <GarageCard key={garage.id} garage={garage} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <SectionHeader title="Newest" to="/search?sort=newest" />
          {newestQuery.isLoading && <Spinner />}
          {newestQuery.data && newestQuery.data.items.length > 0 && (
            <div className="space-y-3">
              {newestQuery.data.items.map((garage) => (
                <GarageCard key={garage.id} garage={garage} />
              ))}
            </div>
          )}
        </section>

        {session && (
          <section className="mt-8">
            <SectionHeader title="Your favorites" to="/favorites" />
            {favoritesQuery.isLoading && <Spinner />}
            {favoritesQuery.data?.length === 0 && (
              <EmptyState
                title="No favorites yet"
                description="Save garages you like to find them quickly."
                actionLabel="Search garages"
                onAction={() => {
                  window.location.href = '/search'
                }}
              />
            )}
            {favoritePreview.length > 0 && (
              <div className="space-y-3">
                {favoritePreview.map((fav) =>
                  fav.business ? <GarageCard key={fav.favoriteId} garage={fav.business} /> : null,
                )}
              </div>
            )}
          </section>
        )}

        <nav className="mt-8 grid grid-cols-2 gap-3">
          <Link
            to="/appointments"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm font-medium text-text-primary"
          >
            Appointments
          </Link>
          <Link
            to="/invoices"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm font-medium text-text-primary"
          >
            Invoices
          </Link>
        </nav>
      </div>
    </div>
  )
}
