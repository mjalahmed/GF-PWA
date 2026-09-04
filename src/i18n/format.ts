import type { Locale } from './locale'
import { translate, type Vars } from './messages'

export type TranslateFn = (key: string, vars?: Vars) => string

export function formatDistanceLocalized(
  km: number | undefined,
  t: TranslateFn,
): string {
  if (km == null) return ''
  if (km < 1) return t('fmt.metersAway', { meters: Math.round(km * 1000) })
  return t('fmt.kmAway', { km: km.toFixed(1) })
}

export function formatRatingLocalized(
  rating: number,
  count: number,
  t: TranslateFn,
): string {
  if (count === 0) return t('fmt.noReviews')
  return t('fmt.ratingCount', { rating: rating.toFixed(1), count })
}

export function formatDateLocalized(iso: string, dateLocale: string): string {
  return new Date(iso).toLocaleDateString(dateLocale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTimeLocalized(iso: string, dateLocale: string): string {
  return new Date(iso).toLocaleTimeString(dateLocale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function vehicleLabelLocalized(
  v: {
    year: number
    makeText?: string
    modelText?: string
    displayLabel?: string
  },
  t: TranslateFn,
): string {
  if (v.displayLabel) return v.displayLabel
  const parts = [v.makeText, v.modelText, v.year != null ? String(v.year) : '']
    .map((p) => (p ?? '').toString().trim())
    .filter(Boolean)
  return parts.join(' ') || t('fmt.vehicle')
}

/** Keep for non-React callers / tests — English defaults. */
export function translateStatic(locale: Locale, key: string) {
  return translate(locale, key)
}
