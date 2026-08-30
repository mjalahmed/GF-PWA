import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { GarageCard } from '../components/ui/GarageCard'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { useGeolocation } from '../hooks/useGeolocation'
import { searchBusinesses } from '../services/api/garages'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const { state: geo, requestLocation } = useGeolocation()

  const coords =
    geo.status === 'granted' ? { latitude: geo.latitude, longitude: geo.longitude } : undefined

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['search', submitted, coords?.latitude, coords?.longitude],
    queryFn: () =>
      searchBusinesses({
        query: submitted || undefined,
        sort: coords ? 'distance' : 'relevance',
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        pageSize: 30,
      }),
    enabled: submitted.length > 0 || coords != null,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(query.trim())
  }

  return (
    <div>
      <PageHeader title="Search" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <Input
            label="Search garages"
            placeholder="Name, area, or service…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" loading={isFetching}>
              Search
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={geo.status === 'loading'}
              onClick={requestLocation}
            >
              Near me
            </Button>
          </div>
        </form>

        {geo.status === 'denied' && (
          <p className="mt-2 text-sm text-warning">{geo.message}</p>
        )}
        {geo.status === 'unavailable' && (
          <p className="mt-2 text-sm text-text-muted">{geo.message}</p>
        )}

        <div className="mt-6">
          {!submitted && geo.status !== 'granted' && (
            <EmptyState
              title="Find a garage"
              description="Search by name or tap Near me to see garages sorted by distance."
              icon="🔍"
            />
          )}

          {(submitted || coords) && isLoading && <Spinner />}
          {error && (
            <EmptyState
              title="Search failed"
              description="Something went wrong. Please try again."
              actionLabel="Retry"
              onAction={() => refetch()}
            />
          )}
          {data && data.items.length === 0 && (submitted || coords) && (
            <EmptyState title="No results" description="Try a different search term or widen your area." />
          )}
          {data && data.items.length > 0 && (
            <div className="space-y-3">
              {coords && (
                <p className="text-sm text-text-muted">
                  Showing results near your location
                </p>
              )}
              {data.items.map((garage) => (
                <GarageCard key={garage.id} garage={garage} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
