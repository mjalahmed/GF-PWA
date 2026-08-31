import type { Review, ReviewEligibility, ReviewRatingDimensions } from '../../types/reviews'
import { mapReview, mapReviewEligibility } from '../../lib/mappers'
import { apiClient, buildQuery } from './client'

export async function listReviewEligibilities(params?: { isUsed?: boolean }): Promise<ReviewEligibility[]> {
  const envelope = await apiClient.get(
    `/v1/review-eligibilities${buildQuery({
      isUsed: params?.isUsed,
      unused: params?.isUsed === false ? true : undefined,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return (envelope.data ?? []).map((item) => mapReviewEligibility(item as Record<string, unknown>))
}

export async function getReviewEligibility(id: string): Promise<ReviewEligibility> {
  const envelope = await apiClient.get(`/v1/review-eligibilities/${id}`, (json) => json as Record<string, unknown>)
  return mapReviewEligibility(envelope.data!)
}

export async function listReviews(params?: { businessId?: string }): Promise<Review[]> {
  const envelope = await apiClient.get(
    `/v1/reviews${buildQuery({ businessId: params?.businessId })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return (envelope.data ?? []).map((item) => mapReview(item as Record<string, unknown>))
}

export async function getReview(id: string): Promise<Review> {
  const envelope = await apiClient.get(`/v1/reviews/${id}`, (json) => json as Record<string, unknown>)
  return mapReview(envelope.data!)
}

export async function createReview(body: {
  eligibilityId: string
  overallRating: number
  ratings: ReviewRatingDimensions
  comment?: string
}): Promise<Review> {
  const envelope = await apiClient.post('/v1/reviews', body, (json) => json as Record<string, unknown>)
  return mapReview(envelope.data!)
}

export async function updateReview(
  id: string,
  body: { overallRating: number; ratings: ReviewRatingDimensions; comment?: string },
): Promise<Review> {
  const envelope = await apiClient.patch(`/v1/reviews/${id}`, body, (json) => json as Record<string, unknown>)
  return mapReview(envelope.data!)
}

export async function reportReview(id: string, reasonCode: string, details?: string): Promise<void> {
  await apiClient.post(`/v1/reviews/${id}/report`, { reasonCode, details: details ?? null }, () => ({}))
}
