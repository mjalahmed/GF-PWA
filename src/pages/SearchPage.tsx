import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { GarageCard } from '../components/ui/GarageCard'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useGeolocation } from '../hooks/useGeolocation'
import { useLocale } from '../i18n/LocaleProvider'
import { listProductCategories, listServiceCategories } from '../services/api/catalog'
import { searchBusinesses } from '../services/api/garages'
import { listVehicles } from '../services/api/vehicles'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { session } = useAuth()
  const { t } = useLocale()
  const { state: geo, requestLocation } = useGeolocation()

  const [query, setQuery] = useState(searchParams.get('query') ?? '')
  const [serviceCategory, setServiceCategory] = useState(searchParams.get('serviceCategory') ?? '')
  const [productCategory, setProductCategory] = useState(searchParams.get('productCategory') ?? '')
  const [openNow, setOpenNow] = useState(searchParams.get('openNow') === 'true')
  const [minRating, setMinRating] = useState(searchParams.get('minRating') ?? '')
  const [vehicleId, setVehicleId] = useState(searchParams.get('vehicleId') ?? '')
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'relevance')
  const [submitted, setSubmitted] = useState(false)

  const coords =
    geo.status === 'granted' ? { latitude: geo.latitude, longitude: geo.longitude } : undefined

  const serviceCategoriesQuery = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => listServiceCategories(),
  })

  const productCategoriesQuery = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => listProductCategories(),
  })

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles(),
    enabled: !!session,
  })

  const syncParams = useCallback(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('query', query.trim())
    if (serviceCategory) params.set('serviceCategory', serviceCategory)
    if (productCategory) params.set('productCategory', productCategory)
    if (openNow) params.set('openNow', 'true')
    if (minRating) params.set('minRating', minRating)
    if (vehicleId) params.set('vehicleId', vehicleId)
    if (sort && sort !== 'relevance') params.set('sort', sort)
    setSearchParams(params, { replace: true })
  }, [query, serviceCategory, productCategory, openNow, minRating, vehicleId, sort, setSearchParams])

  useEffect(() => {
    if (searchParams.toString()) setSubmitted(true)
  }, [searchParams])

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: [
      'search',
      query,
      serviceCategory,
      productCategory,
      openNow,
      minRating,
      vehicleId,
      sort,
      coords?.latitude,
      coords?.longitude,
      submitted,
    ],
    queryFn: () =>
      searchBusinesses({
        query: query.trim() || undefined,
        serviceCategory: serviceCategory || undefined,
        productCategory: productCategory || undefined,
        openNow: openNow || undefined,
        minimumRating: minRating ? Number(minRating) : undefined,
        vehicleId: vehicleId || undefined,
        sort: coords && sort === 'relevance' ? 'distance' : sort,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        pageSize: 30,
      }),
    enabled: submitted,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    syncParams()
    setSubmitted(true)
  }

  const hasFilters =
    !!query.trim() ||
    !!serviceCategory ||
    !!productCategory ||
    openNow ||
    !!minRating ||
    !!vehicleId ||
    coords != null

  return (
    <div>
      <PageHeader title={t('search.title')} />
      <div className="mx-auto max-w-lg px-4 py-4">
        <form onSubmit={handleSearch} className="space-y-3">
          <Input
            label={t('search.label')}
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text-secondary">{t('search.serviceCategory')}</span>
              <select
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
              >
                <option value="">{t('search.anyService')}</option>
                {serviceCategoriesQuery.data?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text-secondary">{t('search.productCategory')}</span>
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
              >
                <option value="">{t('search.anyProduct')}</option>
                {productCategoriesQuery.data?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text-secondary">{t('search.minRating')}</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
              >
                <option value="">{t('search.anyRating')}</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={String(r)}>
                    {t('search.starsPlus', { rating: r })}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text-secondary">{t('search.sortBy')}</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
              >
                <option value="relevance">{t('search.sort.relevance')}</option>
                <option value="rating">{t('search.sort.rating')}</option>
                <option value="newest">{t('search.sort.newest')}</option>
                <option value="distance">{t('search.sort.distance')}</option>
              </select>
            </label>
          </div>

          {session && vehiclesQuery.data && vehiclesQuery.data.length > 0 && (
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text-secondary">{t('search.vehicle')}</span>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary"
              >
                <option value="">{t('search.anyVehicle')}</option>
                {vehiclesQuery.data.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.displayLabel ?? t('search.yearVehicle', { year: v.year })}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              className="size-4 rounded border-border text-primary"
            />
            {t('search.openNowOnly')}
          </label>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" loading={isFetching}>
              {t('search.submit')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={geo.status === 'loading'}
              onClick={requestLocation}
            >
              {t('search.nearMe')}
            </Button>
          </div>
        </form>

        {(geo.status === 'denied' || geo.status === 'unavailable') && (
          <p
            className={`mt-2 text-sm ${geo.status === 'denied' ? 'text-warning' : 'text-text-muted'}`}
          >
            {t(geo.messageKey)}
          </p>
        )}

        <div className="mt-6">
          {!submitted && !hasFilters && (
            <EmptyState
              title={t('search.findTitle')}
              description={t('search.findDesc')}
              icon="🔍"
            />
          )}

          {submitted && isLoading && <Spinner />}
          {error && (
            <EmptyState
              title={t('search.failedTitle')}
              description={t('search.failedDesc')}
              actionLabel={t('common.retry')}
              onAction={() => refetch()}
            />
          )}
          {data && data.items.length === 0 && submitted && (
            <EmptyState title={t('search.noResults')} description={t('search.noResultsDesc')} />
          )}
          {data && data.items.length > 0 && (
            <div className="space-y-3">
              {coords && <p className="text-sm text-text-muted">{t('search.nearHint')}</p>}
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
