import type { PaginatedResult } from '../../types/api'
import type { DiscoveryBusiness } from '../../types/discovery'
import { mapBusiness } from '../../lib/mappers'
import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function searchBusinesses(params: {
  query?: string
  city?: string
  area?: string
  businessCategory?: string
  serviceCategory?: string
  productCategory?: string
  minimumRating?: number
  openNow?: boolean
  vehicleId?: string
  hasServices?: boolean
  hasProducts?: boolean
  sort?: string
  page?: number
  pageSize?: number
  latitude?: number
  longitude?: number
}): Promise<PaginatedResult<DiscoveryBusiness>> {
  const envelope = await apiClient.get(
    `${customerPaths.discovery.businesses}${buildQuery({
      query: params.query,
      city: params.city,
      area: params.area,
      businessCategory: params.businessCategory,
      serviceCategory: params.serviceCategory,
      productCategory: params.productCategory,
      minimumRating: params.minimumRating,
      openNow: params.openNow,
      vehicleId: params.vehicleId,
      hasServices: params.hasServices,
      hasProducts: params.hasProducts,
      sort: params.sort ?? 'relevance',
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      latitude: params.latitude,
      longitude: params.longitude,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return {
    items: (envelope.data ?? []).map((item) => mapBusiness(item as Record<string, unknown>)),
    pagination: envelope.meta?.pagination,
  }
}

export async function getBusinessBySlug(
  slug: string,
  coords?: { latitude: number; longitude: number },
): Promise<DiscoveryBusiness> {
  const envelope = await apiClient.get(
    `${customerPaths.discovery.business(slug)}${buildQuery({
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    })}`,
    (json) => json as Record<string, unknown>,
  )
  return mapBusiness(envelope.data!)
}

export { listPublicServices, listPublicProducts } from './catalog'
