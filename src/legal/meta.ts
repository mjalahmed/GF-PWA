/** Single place to update operator identity for all legal documents. */
export const LEGAL_VERSION = '1.0'

/** Shared package effective date (English form for meta/API display). */
export const LEGAL_EFFECTIVE_DATE = '2 September 2026'
export const LEGAL_EFFECTIVE_DATE_AR = '2 سبتمبر 2026'

export const LEGAL_OPERATOR = {
  fullName: 'Mustafa Jasem AlAhmed',
  businessEmail: 'garagefinder007@gmail.com',
  privacyEmail: 'garagefinder007@gmail.com',
  addressEn: 'Kingdom of Bahrain',
  addressAr: 'مملكة البحرين',
} as const

export type LegalLocale = 'en' | 'ar'

export type LegalDocumentType =
  | 'customer_terms'
  | 'privacy_policy'
  | 'provider_agreement'
  | 'beta_notice'
  | 'dispute_policy'
  | 'review_policy'
  | 'cancellation_refund'

export type LegalDocId =
  | 'terms'
  | 'privacy'
  | 'provider'
  | 'beta'
  | 'disputes'
  | 'reviews'
  | 'cancellation'

export interface LegalSection {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export interface LocalizedLegalBody {
  title: string
  subtitle?: string
  effectiveDate: string
  lastUpdated: string
  sections: LegalSection[]
}

export interface LegalDocument {
  id: LegalDocId
  type: LegalDocumentType
  version: string
  locales: Record<LegalLocale, LocalizedLegalBody>
}

export function localizeLegalDocument(
  doc: LegalDocument,
  locale: LegalLocale | string | null | undefined,
): LocalizedLegalBody & Pick<LegalDocument, 'id' | 'type' | 'version'> {
  const lang: LegalLocale = locale === 'ar' ? 'ar' : 'en'
  return {
    id: doc.id,
    type: doc.type,
    version: doc.version,
    ...doc.locales[lang],
  }
}
