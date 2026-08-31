import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { GarageCard } from '../components/ui/GarageCard'
import { Spinner } from '../components/ui/Spinner'
import { useLocale } from '../i18n/LocaleProvider'
import { listFavorites, removeFavorite } from '../services/api/favorites'

export function FavoritesPage() {
  const queryClient = useQueryClient()
  const { t } = useLocale()

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
      <PageHeader title={t('favorites.title')} backTo="/profile" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}
        {error && (
          <EmptyState
            title={t('favorites.loadError')}
            actionLabel={t('common.retry')}
            onAction={() => refetch()}
          />
        )}
        {data?.length === 0 && (
          <EmptyState
            title={t('favorites.empty')}
            description={t('favorites.emptyDesc')}
            actionLabel={t('common.searchGarages')}
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
                    {t('common.remove')}
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
