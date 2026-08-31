import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { GarageCard } from '../components/ui/GarageCard'
import { Spinner } from '../components/ui/Spinner'
import { listFavorites, removeFavorite } from '../services/api/favorites'

export function FavoritesPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => listFavorites(),
  })

  const removeMutation = useMutation({
    mutationFn: (businessId: string) => removeFavorite(businessId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  return (
    <div>
      <PageHeader title="Favorites" backTo="/profile" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}
        {error && (
          <EmptyState title="Could not load favorites" actionLabel="Retry" onAction={() => refetch()} />
        )}
        {data?.length === 0 && (
          <EmptyState
            title="No favorites yet"
            description="Tap the heart on a garage to save it here."
            actionLabel="Search garages"
            onAction={() => {
              window.location.href = '/search'
            }}
            icon="❤️"
          />
        )}
        {data && data.length > 0 && (
          <div className="space-y-3">
            {data.map((fav) =>
              fav.business ? (
                <div key={fav.favoriteId} className="relative">
                  <GarageCard garage={fav.business} />
                  <Button
                    variant="ghost"
                    className="absolute right-3 top-3 text-xs"
                    loading={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(fav.businessId)}
                  >
                    Remove
                  </Button>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  )
}
