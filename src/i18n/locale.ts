export type Locale = 'en' | 'ar'

export const LOCALE_STORAGE_KEY = 'garagefinder.locale'

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ar'
}

export function readStoredLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(raw) ? raw : null
  } catch {
    return null
  }
}

export function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore quota / private mode
  }
}

export function applyDocumentLocale(locale: Locale): void {
  const root = document.documentElement
  root.lang = locale
  root.dir = locale === 'ar' ? 'rtl' : 'ltr'
}
