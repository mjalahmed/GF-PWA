export interface CategoryRef {
  id: string
  code: string
  name: string
}

export interface PublicImage {
  id: string
  storagePath: string
  altText?: string
  sortOrder: number
  isPrimary: boolean
}

export interface PublicService {
  id: string
  slug: string
  name: string
  description?: string
  category: CategoryRef
  pricingType: string
  price?: number
  minimumPrice?: number
  maximumPrice?: number
  estimatedDurationMinutes?: number
  requiresAppointment: boolean
  requiresVehicle: boolean
  images: PublicImage[]
}

export interface PublicProduct {
  id: string
  slug: string
  name: string
  description?: string
  category: CategoryRef
  price?: number
  salePrice?: number
  stockStatus?: string
  images: PublicImage[]
}

export interface VehicleMake {
  id: string
  name: string
  slug: string
}

export interface VehicleModel {
  id: string
  makeId: string
  name: string
  slug: string
}
