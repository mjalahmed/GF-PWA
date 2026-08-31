import { cn } from '../../lib/utils'
import { useLocale } from '../../i18n/LocaleProvider'

export function StarRating({ rating, className }: { rating: number; className?: string }) {
  const { t } = useLocale()
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-rating', className)}
      aria-label={t('common.starsAria', { rating })}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn('text-sm', i < full || (i === full && half) ? 'opacity-100' : 'opacity-25')}>
          ★
        </span>
      ))}
    </span>
  )
}
