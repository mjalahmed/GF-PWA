import { betaNotice } from './beta-notice'
import { cancellationRefundPolicy } from './cancellation-refund'
import { customerTerms } from './customer-terms'
import { disputePolicy } from './dispute-policy'
import {
  LEGAL_VERSION,
  localizeLegalDocument,
  type LegalDocId,
  type LegalDocument,
  type LegalDocumentType,
  type LegalLocale,
} from './meta'
import { privacyPolicy } from './privacy-policy'
import { providerAgreement } from './provider-agreement'
import { reviewPolicy } from './review-policy'

export * from './meta'

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  customerTerms,
  privacyPolicy,
  providerAgreement,
  betaNotice,
  disputePolicy,
  reviewPolicy,
  cancellationRefundPolicy,
]

export const LEGAL_DOC_BY_ID: Record<LegalDocId, LegalDocument> = {
  terms: customerTerms,
  privacy: privacyPolicy,
  provider: providerAgreement,
  beta: betaNotice,
  disputes: disputePolicy,
  reviews: reviewPolicy,
  cancellation: cancellationRefundPolicy,
}

export function getLegalDocument(
  id: string,
  locale?: LegalLocale | string | null,
) {
  const doc = LEGAL_DOC_BY_ID[id as LegalDocId]
  if (!doc) return undefined
  return localizeLegalDocument(doc, locale)
}

/** Documents customers accept at signup. */
export const CUSTOMER_SIGNUP_ACCEPTANCES: {
  documentType: LegalDocumentType
  documentVersion: string
}[] = [
  { documentType: 'customer_terms', documentVersion: LEGAL_VERSION },
  { documentType: 'privacy_policy', documentVersion: LEGAL_VERSION },
]

export const PROVIDER_ACCEPTANCE = {
  documentType: 'provider_agreement' as const,
  documentVersion: LEGAL_VERSION,
}
