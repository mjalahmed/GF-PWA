import { Link } from 'react-router-dom'
import type { DiscoveryBusiness } from '../../types/discovery'
import { primaryBranch } from '../../lib/utils'
import { useLocale } from '../../i18n/LocaleProvider'
import { formatDistanceLocalized, formatRatingLocalized } from '../../i18n/format'
import { StarRating } from './StarRating'

interface GarageCardProps {
  garage: DiscoveryBusiness
}

export function GarageCard({ garage }: GarageCardProps) {
  const { t } = useLocale()
  const branch = primaryBranch(garage)
  const area = branch?.area ?? garage.areas[0]

  return (
    <Link
      to={`/garages/${garage.slug}`}
      className="block rounded-2xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary-light text-lg font-bold text-primary">
          {garage.displayName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-text-primary">{garage.displayName}</h3>
          {area && <p className="truncate text-sm text-text-muted">{area}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <StarRating rating={garage.averageRating} />
            <span className="text-text-muted">
              {formatRatingLocalized(garage.averageRating, garage.ratingCount, t)}
            </span>
            {garage.openingState && (
              <span className={garage.openingState.isOpen ? 'text-success' : 'text-text-subtle'}>
                {garage.openingState.isOpen ? t('common.open') : t('common.closed')}
              </span>
            )}
          </div>
          {garage.distanceKm != null && (
            <p className="mt-1 text-xs text-text-subtle">
              {formatDistanceLocalized(garage.distanceKm, t)}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
