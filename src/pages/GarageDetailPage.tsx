import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StarRating } from '../components/ui/StarRating'
import { StorageImage } from '../components/ui/StorageImage'
import { Tabs } from '../components/ui/Tabs'
import { useAuth } from '../hooks/useAuth'
import { useGeolocation } from '../hooks/useGeolocation'
import {
  formatDateLocalized,
  formatDistanceLocalized,
  formatRatingLocalized,
} from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { formatMoney, primaryBranch } from '../lib/utils'
import { listBusinessReviews, listPublicProducts, listPublicServices } from '../services/api/catalog'
import { addFavorite, listFavorites, removeFavorite } from '../services/api/favorites'
import { getBusinessBySlug } from '../services/api/garages'

type TabId = 'overview' | 'services' | 'products' | 'reviews'

export function GarageDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const { t, dateLocale } = useLocale()
  const { state: geo } = useGeolocation()
  const [tab, setTab] = useState<TabId>('overview')

  const coords =
    geo.status === 'granted' ? { latitude: geo.latitude, longitude: geo.longitude } : undefined

  const garageQuery = useQuery({
    queryKey: ['garage', slug, coords?.latitude, coords?.longitude],
    queryFn: () => getBusinessBySlug(slug!, coords),
    enabled: !!slug,
  })

  const garage = garageQuery.data

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => listFavorites(),
    enabled: !!session,
  })

  const isFavorite = favoritesQuery.data?.some((f) => f.businessId === garage?.id) ?? false

  const servicesQuery = useQuery({
    queryKey: ['garage-services', slug],
    queryFn: () => listPublicServices(slug!),
    enabled: !!slug && tab === 'services',
  })

  const productsQuery = useQuery({
    queryKey: ['garage-products', slug],
    queryFn: () => listPublicProducts(slug!),
    enabled: !!slug && tab === 'products',
  })

  const reviewsQuery = useQuery({
    queryKey: ['garage-reviews', garage?.id],
    queryFn: () => listBusinessReviews(garage!.id),
    enabled: !!garage?.id && tab === 'reviews',
  })

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!garage) return
      if (isFavorite) await removeFavorite(garage.id)
      else await addFavorite(garage.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  if (garageQuery.isLoading) return <Spinner />
  if (garageQuery.error || !garage) {
    return (
      <div>
        <PageHeader title={t('garage.title')} backTo="/search" />
        <EmptyState
          title={t('garage.notFound')}
          description={t('garage.notFoundDesc')}
          actionLabel={t('garage.backToSearch')}
          onAction={() => navigate('/search')}
        />
      </div>
    )
  }

  const branch = primaryBranch(garage)
  const verified = garage.verificationStatus === 'verified'

  return (
    <div>
      <PageHeader
        title={garage.displayName}
        backTo="/search"
        action={
          session ? (
            <button
              type="button"
              onClick={() => favoriteMutation.mutate()}
              disabled={favoriteMutation.isPending}
              className="text-xl"
              aria-label={isFavorite ? t('garage.removeFavorite') : t('garage.addFavorite')}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-lg">
        <div className="relative h-40 w-full overflow-hidden bg-primary-light">
          <StorageImage
            bucket="business-media"
            path={garage.coverPath}
            alt={t('common.coverAlt', { name: garage.displayName })}
            className="size-full object-cover"
            fallback=""
          />
        </div>

        <div className="px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-surface">
              <StorageImage
                bucket="business-media"
                path={garage.logoPath}
                alt={garage.displayName}
                className="size-full object-cover"
                fallback={garage.displayName.charAt(0)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {verified && (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    {t('common.verified')}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <StarRating rating={garage.averageRating} />
                <span className="text-sm text-text-muted">
                  {formatRatingLocalized(garage.averageRating, garage.ratingCount, t)}
                </span>
              </div>
              {garage.openingState && (
                <p
                  className={
                    garage.openingState.isOpen ? 'mt-1 text-sm text-success' : 'mt-1 text-sm text-text-subtle'
                  }
                >
                  {garage.openingState.isOpen ? t('common.openNow') : t('common.closed')}
                </p>
              )}
              {garage.distanceKm != null && (
                <p className="mt-1 text-sm text-text-muted">
                  {formatDistanceLocalized(garage.distanceKm, t)}
                </p>
              )}
            </div>
          </div>

          <Tabs
            tabs={[
              { id: 'overview', label: t('garage.tab.overview') },
              { id: 'services', label: t('garage.tab.services', { count: garage.serviceCount }) },
              { id: 'products', label: t('garage.tab.products', { count: garage.productCount }) },
              { id: 'reviews', label: t('garage.tab.reviews') },
            ]}
            active={tab}
            onChange={(id) => setTab(id as TabId)}
          />

          <div className="mt-4">
            {tab === 'overview' && (
              <>
                {garage.description && (
                  <p className="text-sm leading-relaxed text-text-secondary">{garage.description}</p>
                )}
                {branch && (
                  <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
                    <h2 className="font-semibold text-text-primary">{t('common.location')}</h2>
                    <p className="mt-2 text-sm text-text-secondary">{branch.addressLine}</p>
                    {(branch.area || branch.city) && (
                      <p className="text-sm text-text-muted">
                        {[branch.area, branch.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {branch.phone && (
                      <a
                        href={`tel:${branch.phone}`}
                        className="mt-3 inline-block text-sm font-medium text-primary"
                      >
                        {branch.phone}
                      </a>
                    )}
                  </section>
                )}
                {garage.branches.length > 1 && (
                  <section className="mt-4">
                    <h2 className="mb-3 font-semibold text-text-primary">{t('common.allBranches')}</h2>
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
              </>
            )}

            {tab === 'services' && (
              <>
                {servicesQuery.isLoading && <Spinner />}
                {servicesQuery.data?.items.length === 0 && (
                  <EmptyState
                    title={t('garage.noServices')}
                    description={t('garage.noServicesDesc')}
                  />
                )}
                <div className="space-y-3">
                  {servicesQuery.data?.items.map((svc) => (
                    <article key={svc.id} className="rounded-xl border border-border bg-surface p-4">
                      <h3 className="font-semibold text-text-primary">{svc.name}</h3>
                      {svc.description && (
                        <p className="mt-1 text-sm text-text-muted line-clamp-2">{svc.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-text-secondary">
                        <span>{svc.category.name}</span>
                        {svc.price != null && <span>{formatMoney(svc.price)}</span>}
                        {svc.estimatedDurationMinutes != null && (
                          <span>{t('common.minutes', { minutes: svc.estimatedDurationMinutes })}</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {tab === 'products' && (
              <>
                {productsQuery.isLoading && <Spinner />}
                {productsQuery.data?.items.length === 0 && (
                  <EmptyState
                    title={t('garage.noProducts')}
                    description={t('garage.noProductsDesc')}
                  />
                )}
                <div className="space-y-3">
                  {productsQuery.data?.items.map((prod) => (
                    <article key={prod.id} className="rounded-xl border border-border bg-surface p-4">
                      <h3 className="font-semibold text-text-primary">{prod.name}</h3>
                      {prod.description && (
                        <p className="mt-1 text-sm text-text-muted line-clamp-2">{prod.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-text-secondary">
                        <span>{prod.category.name}</span>
                        {prod.salePrice != null ? (
                          <span>{formatMoney(prod.salePrice)}</span>
                        ) : prod.price != null ? (
                          <span>{formatMoney(prod.price)}</span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {tab === 'reviews' && (
              <>
                {reviewsQuery.isLoading && <Spinner />}
                {reviewsQuery.data?.items.length === 0 && (
                  <EmptyState title={t('garage.noReviews')} description={t('garage.noReviewsDesc')} />
                )}
                <div className="space-y-3">
                  {reviewsQuery.data?.items.map((review) => (
                    <article key={review.id} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.overallRating} />
                        <span className="text-xs text-text-muted">
                          {formatDateLocalized(review.createdAt, dateLocale)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-text-secondary">{review.comment}</p>
                      )}
                      {review.response && (
                        <div className="mt-3 rounded-lg bg-surface-secondary p-3 text-sm">
                          <p className="font-medium text-text-primary">{t('common.garageResponse')}</p>
                          <p className="mt-1 text-text-muted">{review.response.message}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>

          <Link to={`/garages/${garage.slug}/book`} className="mt-4 block">
            <Button className="w-full">{t('garage.book')}</Button>
          </Link>
          <Link to={`/garages/${garage.slug}/request-quote`} className="mt-2 block">
            <Button variant="secondary" className="w-full">
              {t('quotes.requestTitle')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
