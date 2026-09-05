import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyDocumentLocale,
  isLocale,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  writeStoredLocale,
} from '../src/i18n/locale'
import { translate } from '../src/i18n/messages'

describe('locale helpers', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
  })

  it('validates locale values', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('ar')).toBe(true)
    expect(isLocale('fr')).toBe(false)
  })

  it('persists and reads locale', () => {
    expect(readStoredLocale()).toBeNull()
    writeStoredLocale('ar')
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ar')
    expect(readStoredLocale()).toBe('ar')
  })

  it('applies document lang and direction', () => {
    applyDocumentLocale('ar')
    expect(document.documentElement.lang).toBe('ar')
    expect(document.documentElement.dir).toBe('rtl')
    applyDocumentLocale('en')
    expect(document.documentElement.dir).toBe('ltr')
  })
})

describe('translate', () => {
  it('returns English and Arabic strings', () => {
    expect(translate('en', 'nav.home')).toBe('Home')
    expect(translate('ar', 'nav.home')).toBe('الرئيسية')
  })

  it('exposes language symbols', () => {
    expect(translate('en', 'lang.symbolEn')).toBe('E')
    expect(translate('en', 'lang.symbolAr')).toBe('ع')
  })

  it('interpolates variables', () => {
    expect(translate('en', 'garage.tab.services', { count: 4 })).toBe('Services (4)')
    expect(translate('ar', 'garage.tab.services', { count: 4 })).toBe('الخدمات (4)')
  })

  it('translates statuses', () => {
    expect(translate('en', 'status.confirmed')).toBe('Confirmed')
    expect(translate('ar', 'status.confirmed')).toBe('مؤكد')
  })
})
