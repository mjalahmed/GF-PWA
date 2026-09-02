import type { ApplicationDetail, ApplicationDocument, BusinessApplication } from '../../types/onboarding'
import { apiClient, buildQuery } from './client'
import { adminPaths } from './paths'

function asArray<T>(json: unknown): T[] {
  return Array.isArray(json) ? (json as T[]) : []
}

export async function listAdminApplications(params?: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<BusinessApplication[]> {
  const envelope = await apiClient.get(
    `${adminPaths.applications}${buildQuery({
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 50,
    })}`,
    (json) => asArray<BusinessApplication>(json),
  )
  return envelope.data ?? []
}

export async function getAdminApplication(id: string): Promise<ApplicationDetail> {
  const envelope = await apiClient.get(
    adminPaths.application(id),
    (json) => json as ApplicationDetail,
  )
  return envelope.data!
}

export async function startApplicationReview(id: string): Promise<BusinessApplication> {
  const envelope = await apiClient.post(
    adminPaths.applicationAction(id, 'start-review'),
    {},
    (json) => json as BusinessApplication,
  )
  return envelope.data!
}

export async function requestApplicationChanges(
  id: string,
  reason: string,
): Promise<BusinessApplication> {
  const envelope = await apiClient.post(
    adminPaths.applicationAction(id, 'request-changes'),
    { reason },
    (json) => json as BusinessApplication,
  )
  return envelope.data!
}

export async function approveApplication(
  id: string,
): Promise<{ businessId: string; slug?: string; idempotent: boolean }> {
  const envelope = await apiClient.post(
    adminPaths.applicationAction(id, 'approve'),
    {},
    (json) => json as { businessId: string; slug?: string; idempotent: boolean },
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function rejectApplication(id: string, reason: string): Promise<BusinessApplication> {
  const envelope = await apiClient.post(
    adminPaths.applicationAction(id, 'reject'),
    { reason },
    (json) => json as BusinessApplication,
  )
  return envelope.data!
}

export async function reviewApplicationDocument(
  applicationId: string,
  documentId: string,
  input: { status: 'approved' | 'rejected'; rejectionReason?: string | null },
): Promise<ApplicationDocument> {
  const envelope = await apiClient.post(
    adminPaths.applicationDocumentReview(applicationId, documentId),
    input as Record<string, unknown>,
    (json) => json as ApplicationDocument,
  )
  return envelope.data!
}

export async function listAdminDisputes(params?: {
  status?: string
}): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${adminPaths.disputes}${buildQuery({ status: params?.status })}`,
    (json) => asArray<Record<string, unknown>>(json),
  )
  return envelope.data ?? []
}

export async function listAdminReviews(params?: {
  status?: string
}): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${adminPaths.reviews}${buildQuery({ status: params?.status })}`,
    (json) => asArray<Record<string, unknown>>(json),
  )
  return envelope.data ?? []
}
