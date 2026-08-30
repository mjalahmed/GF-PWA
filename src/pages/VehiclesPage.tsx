import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { listVehicles } from '../services/api/vehicles'

export function VehiclesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles(),
  })

  return (
    <div>
      <PageHeader title="My vehicles" backTo="/profile" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title="Could not load vehicles"
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        )}
        {data && data.length === 0 && (
          <EmptyState
            title="No vehicles yet"
            description="Add a vehicle from the GarageFinder mobile app to see it here."
            icon="🚗"
          />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((vehicle) => (
              <article key={vehicle.id} className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">
                    {vehicle.displayLabel ?? `${vehicle.year} vehicle`}
                  </h3>
                  {vehicle.isDefault && (
                    <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                      Default
                    </span>
                  )}
                </div>
                {vehicle.plateNumber && (
                  <p className="mt-1 text-sm text-text-muted">{vehicle.plateNumber}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
