import { Link } from 'react-router-dom'
import { StorageImage } from './StorageImage'
import { vehicleLabelLocalized } from '../../i18n/format'
import { useLocale } from '../../i18n/LocaleProvider'
import type { Vehicle } from '../../types/discovery'

function verificationBadgeClass(status?: string): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'verified') return 'bg-success/15 text-success'
  if (s === 'pending' || s === 'pending_verification' || s === 'unverified') {
    return 'bg-warning/15 text-warning'
  }
  if (s === 'correction_requested' || s === 'rejected') return 'bg-error/15 text-error'
  return 'bg-surface-secondary text-text-secondary'
}

type VehicleCardProps = {
  vehicle: Vehicle
  to?: string
  compact?: boolean
}

export function VehicleCard({ vehicle, to, compact }: VehicleCardProps) {
  const { t, statusLabel } = useLocale()
  const label = vehicleLabelLocalized(vehicle, t)
  const href = to ?? `/vehicles/${vehicle.id}`
  const verification = vehicle.verificationStatus || vehicle.confirmationStatus

  return (
    <Link
      to={href}
      className="block overflow-hidden rounded-2xl border border-border bg-surface no-underline hover:shadow-md"
    >
      {vehicle.imagePath ? (
        <StorageImage
          bucket="vehicle-images"
          path={vehicle.imagePath}
          alt={label}
          className={compact ? 'aspect-[16/9] w-full object-cover' : 'aspect-video w-full object-cover'}
        />
      ) : (
        <div
          className={`flex items-center justify-center bg-surface-secondary text-4xl text-text-subtle ${
            compact ? 'aspect-[16/9]' : 'aspect-video'
          }`}
          aria-hidden
        >
          🚗
        </div>
      )}
      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-text-primary">{label}</h3>
          </div>
          {vehicle.isDefault && (
            <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
              {t('common.default')}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {vehicle.plateNumber && (
            <span className="rounded-lg bg-surface-secondary px-2 py-0.5 font-mono text-sm text-text-primary">
              {vehicle.plateNumber}
            </span>
          )}
          {verification && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${verificationBadgeClass(verification)}`}
            >
              {statusLabel(verification)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
