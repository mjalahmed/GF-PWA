import { useLocale } from '../../i18n/LocaleProvider'

type ComingSoonProps = {
  title?: string
  description?: string
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const { t } = useLocale()
  return (
    <div className="rounded-2xl border border-dashed border-primary/40 bg-primary-light/40 p-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {t('comingSoon.badge')}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-text-primary">
        {title ?? t('comingSoon.title')}
      </h3>
      <p className="mt-2 text-sm text-text-muted">{description ?? t('comingSoon.description')}</p>
    </div>
  )
}
