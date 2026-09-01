import { Link } from 'react-router-dom'
import { useLocale } from '../../i18n/LocaleProvider'

type VinReminderBannerProps = {
  vehicleId?: string
  className?: string
}

export function VinReminderBanner({ vehicleId, className = '' }: VinReminderBannerProps) {
  const { t } = useLocale()
  const editTo = vehicleId ? `/vehicles/${vehicleId}/edit` : '/vehicles/new'

  return (
    <div
      className={`rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 ${className}`}
    >
      <p className="font-medium">{t('vehicles.vinReminderTitle')}</p>
      <p className="mt-1 text-xs opacity-90">{t('vehicles.vinReminderBody')}</p>
      <Link to={editTo} className="mt-2 inline-block text-xs font-semibold text-primary">
        {t('vehicles.addVin')}
      </Link>
    </div>
  )
}
