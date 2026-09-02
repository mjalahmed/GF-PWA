import { apiClient } from './client'
import { platformPaths } from './paths'
import type { LegalDocumentType } from '../../legal'

export async function recordLegalAcceptance(input: {
  documentType: LegalDocumentType
  documentVersion: string
  businessId?: string | null
}) {
  const envelope = await apiClient.post(
    platformPaths.legalAcceptances,
    {
      documentType: input.documentType,
      documentVersion: input.documentVersion,
      ...(input.businessId ? { businessId: input.businessId } : {}),
    },
    (json) => json as Record<string, unknown>,
  )
  return envelope.data
}

export async function recordLegalAcceptances(
  items: { documentType: LegalDocumentType; documentVersion: string; businessId?: string | null }[],
) {
  for (const item of items) {
    try {
      await recordLegalAcceptance(item)
    } catch {
      // Acceptance recording should not block account creation if the API is briefly unavailable
    }
  }
}
