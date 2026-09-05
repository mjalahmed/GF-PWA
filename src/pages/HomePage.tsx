import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ActiveServiceCard, isActiveServiceAppointment } from '../components/customer/ActiveServiceCard'
import { PageHeader } from '../components/layout/PageHeader'
import { NotificationBell } from '../components/layout/NotificationBell'
import { ComingSoon } from '../components/ui/ComingSoon'
import { EmptyState } from '../components/ui/EmptyState'
import { GarageCard } from '../components/ui/GarageCard'
import { Spinner } from '../components/ui/Spinner'
import { VehicleCard } from '../components/ui/VehicleCard'
import { VinReminderBanner } from '../components/ui/VinReminderBanner'
import { useAuth } from '../hooks/useAuth'
import { vehicleLabelLocalized } from '../i18n/format'
import { localizedCategoryName } from '../i18n/localized'
import { useLocale } from '../i18n/LocaleProvider'
import { listAppointments } from '../services/api/appointments'
import { listServiceCategories } from '../services/api/catalog'
import { listAnnouncements } from '../services/api/experience'
import { listFavorites } from '../services/api/favorites'
import { searchBusinesses } from '../services/api/garages'
import { listInvoices } from '../services/api/invoices'
import { listQuotations } from '../services/api/quotations'
import { listVehicles, listPendingVehicleConfirmations } from '../services/api/vehicles'

function SectionHeader({ title, to, seeAllLabel }: { title: string; to: string; seeAllLabel: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <Link to={to} className="text-sm font-medium text-primary">
        {seeAllLabel}
      </Link>
    </div>
  )
}

export function HomePage() {
  const { session } = useAuth()
  const { t, locale } = useLocale()

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

  const pendingVehiclesQuery = useQuery({
    queryKey: ['vehicles-pending'],
    queryFn: () => listPendingVehicleConfirmations(),
    enabled: !!session,
  })

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'home-active'],
    queryFn: () => listAppointments(),
    enabled: !!session,
    refetchInterval: 60_000,
  })

  const quotationsQuery = useQuery({
    queryKey: ['quotations', 'home'],
    queryFn: () => listQuotations(),
    enabled: !!session,
  })

  const invoicesQuery = useQuery({
    queryKey: ['invoices', 'home'],
    queryFn: () => listInvoices(),
    enabled: !!session,
  })

  const announcementsQuery = useQuery({
    queryKey: ['announcements'],
    queryFn: () => listAnnouncements(),
  })

  const defaultVehicle = vehiclesQuery.data?.find((v) => v.isDefault) ?? vehiclesQuery.data?.[0]
  const favoritePreview = favoritesQuery.data?.slice(0, 3) ?? []

  const activeAppointment = useMemo(() => {
    const items = appointmentsQuery.data ?? []
    return (
      items.find((a) => a.status === 'in_progress') ??
      items.find((a) => isActiveServiceAppointment(a.status)) ??
      null
    )
  }, [appointmentsQuery.data])

  const upcomingAppointment = useMemo(() => {
    const now = Date.now()
    const upcoming = (appointmentsQuery.data ?? [])
      .filter((a) =>
        ['requested', 'confirmed', 'quote_pending', 'quote_accepted'].includes(a.status),
      )
      .filter((a) => new Date(a.scheduledStart).getTime() >= now - 60_000)
      .sort(
        (a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime(),
      )
    return upcoming[0] ?? null
  }, [appointmentsQuery.data])

  const pendingQuotes = useMemo(
    () =>
      (quotationsQuery.data ?? []).filter((q) =>
        ['issued', 'viewed', 'sent'].includes(q.status),
      ),
    [quotationsQuery.data],
  )

  const outstandingInvoices = useMemo(
    () =>
      (invoicesQuery.data ?? []).filter(
        (inv) =>
          inv.remainingTotal > 0 &&
          !['paid', 'cancelled', 'refunded', 'draft'].includes(inv.status),
      ),
    [invoicesQuery.data],
  )

  const activeVehicleLabel = useMemo(() => {
    if (!activeAppointment?.vehicleId || !vehiclesQuery.data) return undefined
    const vehicle = vehiclesQuery.data.find((v) => v.id === activeAppointment.vehicleId)
    return vehicle ? vehicleLabelLocalized(vehicle, t) : undefined
  }, [activeAppointment, vehiclesQuery.data, t])

  return (
    <div>
      <PageHeader brand title={t('home.title')} action={<NotificationBell />} />
      <div className="mx-auto max-w-lg px-4 py-6">
        <section className="rounded-2xl bg-primary px-5 py-6 text-white">
          <h2 className="text-xl font-bold">{t('home.hero')}</h2>
          <p className="mt-2 text-sm text-white/90">{t('home.heroSub')}</p>
          <Link
            to="/search"
            className="mt-4 inline-flex touch-target items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-white/90"
          >
            {t('common.searchGarages')}
          </Link>
        </section>

        {activeAppointment && (
          <ActiveServiceCard appointment={activeAppointment} vehicleLabel={activeVehicleLabel} />
        )}

        {session && (
          <section className="mt-4 grid grid-cols-2 gap-2">
            {upcomingAppointment &&
              (!activeAppointment || upcomingAppointment.id !== activeAppointment.id) && (
                <Link
                  to={`/appointments/${upcomingAppointment.id}`}
                  className="col-span-2 rounded-xl border border-border bg-surface p-3 no-underline"
                >
                  <p className="text-xs font-semibold uppercase text-text-muted">
                    {t('home.upcoming')}
                  </p>
                  <p className="mt-1 font-medium text-text-primary">
                    {upcomingAppointment.businessName ?? t('common.garage')}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(upcomingAppointment.scheduledStart).toLocaleString()}
                  </p>
                </Link>
              )}
            {pendingQuotes.length > 0 && (
              <Link
                to="/quotations"
                className="rounded-xl border border-border bg-surface p-3 no-underline"
              >
                <p className="text-2xl font-semibold text-text-primary">{pendingQuotes.length}</p>
                <p className="text-xs text-text-muted">{t('home.pendingQuotes')}</p>
              </Link>
            )}
            {outstandingInvoices.length > 0 && (
              <Link
                to="/invoices"
                className="rounded-xl border border-border bg-surface p-3 no-underline"
              >
                <p className="text-2xl font-semibold text-text-primary">
                  {outstandingInvoices.length}
                </p>
                <p className="text-xs text-text-muted">{t('home.outstandingInvoices')}</p>
              </Link>
            )}
            {(vehiclesQuery.data?.length ?? 0) > 0 && (
              <Link
                to="/vehicles"
                className="rounded-xl border border-border bg-surface p-3 no-underline"
              >
                <p className="text-2xl font-semibold text-text-primary">
                  {vehiclesQuery.data?.length ?? 0}
                </p>
                <p className="text-xs text-text-muted">{t('home.yourVehicles')}</p>
              </Link>
            )}
          </section>
        )}

        {defaultVehicle && !defaultVehicle.vin && (
          <VinReminderBanner vehicleId={defaultVehicle.id} className="mt-4" />
        )}

        {(pendingVehiclesQuery.data?.length ?? 0) > 0 && (
          <Link
            to="/vehicles"
            className="mt-4 block rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 no-underline"
          >
            <p className="text-sm font-semibold text-warning">
              {t('vehicles.pendingBanner', { count: pendingVehiclesQuery.data!.length })}
            </p>
            <p className="mt-1 text-xs text-text-muted">{t('vehicles.pendingDesc')}</p>
          </Link>
        )}

        {defaultVehicle && (
          <div className="mt-4">
            <VehicleCard vehicle={defaultVehicle} compact />
          </div>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-text-primary">{t('comingSoon.section')}</h2>
          <div className="space-y-3">
            <ComingSoon
              title={t('comingSoon.installmentsTitle')}
              description={t('comingSoon.installmentsDesc')}
            />
            <ComingSoon
              title={t('comingSoon.certifiedTitle')}
              description={t('comingSoon.certifiedDesc')}
            />
            <ComingSoon
              title={t('comingSoon.emergencyTitle')}
              description={t('comingSoon.emergencyDesc')}
            />
            {announcementsQuery.data
              ?.filter(
                (a) =>
                  !['vehicle-history-reports', 'vehicle-health-reminders'].includes(a.slug) &&
                  !/vehicle.?history|vehicle.?health|localhost/i.test(`${a.slug} ${a.title} ${a.summary}`),
              )
              .slice(0, 2)
              .map((a) => (
                <ComingSoon key={a.id} title={a.title} description={a.summary} />
              ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-text-primary">{t('home.browseByService')}</h2>
          {categoriesQuery.isLoading && <Spinner className="py-6" />}
          {categoriesQuery.data && categoriesQuery.data.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {categoriesQuery.data.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/search?serviceCategory=${cat.id}`}
                  className="rounded-2xl border border-border bg-surface px-4 py-5 text-center no-underline transition hover:border-primary"
                >
                  <p className="text-sm font-semibold text-text-primary">
                    {localizedCategoryName(locale, cat)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <SectionHeader
            title={t('home.topRated')}
            to="/search?sort=rating"
            seeAllLabel={t('common.seeAll')}
          />
          {featuredQuery.isLoading && <Spinner />}
          {featuredQuery.error && (
            <EmptyState
              title={t('home.loadError')}
              description={t('home.loadErrorDesc')}
              actionLabel={t('common.retry')}
              onAction={() => featuredQuery.refetch()}
            />
          )}
          {featuredQuery.data?.items.length === 0 && (
            <EmptyState title={t('home.noGarages')} description={t('home.noGaragesDesc')} />
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
          <SectionHeader
            title={t('home.newest')}
            to="/search?sort=newest"
            seeAllLabel={t('common.seeAll')}
          />
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
            <SectionHeader
              title={t('home.yourFavorites')}
              to="/favorites"
              seeAllLabel={t('common.seeAll')}
            />
            {favoritesQuery.isLoading && <Spinner />}
            {favoritesQuery.data?.length === 0 && (
              <EmptyState
                title={t('home.noFavorites')}
                description={t('home.noFavoritesDesc')}
                actionLabel={t('common.searchGarages')}
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
            {t('nav.appointments')}
          </Link>
          <Link
            to="/invoices"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm font-medium text-text-primary"
          >
            {t('nav.invoices')}
          </Link>
        </nav>
      </div>
    </div>
  )
}
