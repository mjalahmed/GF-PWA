export interface ReviewRatingDimensions {
  workQuality: number
  pricingTransparency: number
  timeliness: number
  customerService: number
  overallExperience: number
}

export interface ReviewEligibility {
  id: string
  businessId: string
  businessName?: string
  verificationType: string
  isUsed: boolean
  contextLabel?: string
}

export interface ReviewResponse {
  id: string
  message: string
  respondedAt: string
}

export interface Review {
  id: string
  businessId: string
  businessName?: string
  overallRating: number
  ratings: ReviewRatingDimensions
  comment?: string
  status: string
  createdAt: string
  response?: ReviewResponse
}
