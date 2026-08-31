import { useLocale } from './LocaleProvider'
import type { Locale } from './locale'
import { cn } from '../lib/utils'

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale()
  const active = locale ?? 'en'

  const options: { id: Locale; symbol: string; label: string }[] = [
    { id: 'en', symbol: t('lang.symbolEn'), label: t('lang.english') },
    { id: 'ar', symbol: t('lang.symbolAr'), label: t('lang.arabic') },
  ]

  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className={cn(
        'inline-flex rounded-xl border border-border bg-surface-secondary p-1',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={active === opt.id}
          aria-label={opt.label}
          title={opt.label}
          onClick={() => void setLocale(opt.id)}
          className={cn(
            'min-w-11 rounded-lg px-3 py-2 text-base font-semibold transition-colors',
            active === opt.id
              ? 'bg-primary text-white shadow-sm'
              : 'text-text-muted hover:bg-surface hover:text-text-secondary',
          )}
        >
          {opt.symbol}
        </button>
      ))}
    </div>
  )
}
