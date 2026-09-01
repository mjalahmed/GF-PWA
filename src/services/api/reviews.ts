import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listReviewEligibilities(params?: {
  status?: string
}): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${customerPaths.reviewEligibilities}${buildQuery({ status: params?.status })}`,
    (json) => (Array.isArray(json) ? json : []),
  )
  return (envelope.data ?? []) as Record<string, unknown>[]
}

export async function getReviewEligibility(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.get(customerPaths.reviewEligibility(id), (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function listReviews(params?: { businessId?: string }): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${customerPaths.reviews}${buildQuery({ businessId: params?.businessId })}`,
    (json) => (Array.isArray(json) ? json : []),
  )
  return (envelope.data ?? []) as Record<string, unknown>[]
}

export async function getReview(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.get(customerPaths.review(id), (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function createReview(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(customerPaths.reviews, body, (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function updateReview(id: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const envelope = await apiClient.patch(customerPaths.review(id), body, (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function reportReview(id: string, reasonCode: string, details?: string): Promise<void> {
  await apiClient.post(customerPaths.reviewReport(id), { reasonCode, details: details ?? null }, () => ({}))
}
