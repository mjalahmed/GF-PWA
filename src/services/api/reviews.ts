import type { Review, ReviewEligibility, ReviewRatingDimensions } from '../../types/reviews'
import { mapReview, mapReviewEligibility } from '../../lib/mappers'
import { mapList } from '../../lib/map'
import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listReviewEligibilities(params?: {
  status?: string
  isUsed?: boolean
}): Promise<ReviewEligibility[]> {
  const envelope = await apiClient.get(
    `${customerPaths.reviewEligibilities}${buildQuery({
      status: params?.status,
      isUsed: params?.isUsed,
    })}`,
    (json) => json,
  )
  return mapList(envelope.data, mapReviewEligibility)
}

export async function getReviewEligibility(id: string): Promise<ReviewEligibility> {
  const envelope = await apiClient.get(
    customerPaths.reviewEligibility(id),
    (json) => json as Record<string, unknown>,
  )
  return mapReviewEligibility(envelope.data!)
}

export async function listReviews(params?: { businessId?: string }): Promise<Review[]> {
  const envelope = await apiClient.get(
    `${customerPaths.reviews}${buildQuery({ businessId: params?.businessId })}`,
    (json) => json,
  )
  return mapList(envelope.data, mapReview)
}

export async function getReview(id: string): Promise<Review> {
  const envelope = await apiClient.get(customerPaths.review(id), (json) => json as Record<string, unknown>)
  return mapReview(envelope.data!)
}

export async function createReview(body: {
  eligibilityId: string
  overallRating: number
  ratings: ReviewRatingDimensions
  comment?: string
}): Promise<Review> {
  const envelope = await apiClient.post(customerPaths.reviews, body, (json) => json as Record<string, unknown>)
  return mapReview(envelope.data!)
}

export async function updateReview(
  id: string,
  body: Partial<{ comment: string }>,
): Promise<Review> {
  const envelope = await apiClient.patch(customerPaths.review(id), body, (json) => json as Record<string, unknown>)
  return mapReview(envelope.data!)
}

export async function reportReview(id: string, reasonCode: string, details?: string): Promise<void> {
  await apiClient.post(customerPaths.reviewReport(id), { reasonCode, details: details ?? null }, () => ({}))
}
