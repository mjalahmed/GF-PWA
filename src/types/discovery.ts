export interface PublicBranch {
  id: string
  name: string
  phone?: string
  addressLine: string
  area?: string
  city?: string
  countryCode: string
  latitude?: number
  longitude?: number
  timezone: string
  isPrimary: boolean
}

export interface OpeningState {
  isOpen: boolean
  branchId?: string
  branchName?: string
}

export interface DiscoveryBusiness {
  id: string
  slug: string
  displayName: string
  description?: string
  logoPath?: string
  coverPath?: string
  businessCategoryId: string
  verificationStatus: string
  averageRating: number
  ratingCount: number
  areas: string[]
  branches: PublicBranch[]
  openingState?: OpeningState
  serviceCount: number
  productCount: number
  distanceKm?: number
}

export interface Profile {
  id: string
  fullName: string | null
  phone: string | null
  locale: string | null
  isSuspended: boolean
  avatarPath?: string
  preferredLanguage?: string
}

export interface FavoriteBusiness {
  favoriteId: string
  businessId: string
  createdAt: string
  business?: DiscoveryBusiness
}

export interface Appointment {
  id: string
  status: string
  scheduledStart: string
  scheduledEnd: string
  businessId: string
  branchId: string
  businessName?: string
  branchName?: string
}

export interface Vehicle {
  id: string
  customerId?: string
  makeId: string
  modelId: string
  makeText?: string
  modelText?: string
  year: number
  trim?: string
  engine?: string
  vin?: string
  plateNumber?: string
  color?: string
  mileage?: number
  mileageUnit?: string
  imagePath?: string
  isDefault: boolean
  isActive?: boolean
  displayLabel?: string
}
