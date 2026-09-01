import { PageHeader } from '../components/layout/PageHeader'
import { ComingSoon } from '../components/ui/ComingSoon'
import { useLocale } from '../i18n/LocaleProvider'

const PLANNED_FEATURES = [
  'emergency.towNearest',
  'emergency.towGarage',
  'emergency.roadside',
] as const

export function EmergencyPage() {
  const { t } = useLocale()

  return (
    <div>
      <PageHeader title={t('emergency.title')} backTo="/" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <ComingSoon
          title={t('emergency.comingSoonTitle')}
          description={t('emergency.comingSoonDesc')}
        />
        <ul className="space-y-2">
          {PLANNED_FEATURES.map((key) => (
            <li
              key={key}
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted"
            >
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
