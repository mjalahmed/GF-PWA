import type { Locale } from '../i18n/locale'

/** Prefer Arabic fields when locale is ar; fall back to English. */
export function localizedText(
  locale: Locale,
  en: string | null | undefined,
  ar?: string | null,
): string {
  if (locale === 'ar' && ar?.trim()) return ar.trim()
  return (en ?? '').trim()
}

export function localizedCategoryName(
  locale: Locale,
  cat: { name: string; nameAr?: string | null },
): string {
  return localizedText(locale, cat.name, cat.nameAr)
}
