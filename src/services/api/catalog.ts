import type { PaginatedResult } from '../../types/api'
import type { PublicProduct, PublicService } from '../../types/catalog'
import type { CategoryRef, VehicleMake, VehicleModel } from '../../types/catalog'
import { mapCategoryRef, mapPublicProduct, mapPublicService, mapVehicleMake, mapVehicleModel } from '../../lib/mappers'
import { apiClient, buildQuery } from './client'

export async function listServiceCategories(): Promise<CategoryRef[]> {
  const envelope = await apiClient.get('/v1/service-categories', (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []).map((item) => mapCategoryRef(item as Record<string, unknown>))
}

export async function listProductCategories(): Promise<CategoryRef[]> {
  const envelope = await apiClient.get('/v1/product-categories', (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []).map((item) => mapCategoryRef(item as Record<string, unknown>))
}

export async function listVehicleMakes(): Promise<VehicleMake[]> {
  const envelope = await apiClient.get('/v1/vehicle-makes', (json) => (Array.isArray(json) ? json : []))
  return (envelope.data ?? []).map((item) => mapVehicleMake(item as Record<string, unknown>))
}

export async function listVehicleModels(makeId: string): Promise<VehicleModel[]> {
  const envelope = await apiClient.get(`/v1/vehicle-makes/${makeId}/models`, (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []).map((item) => mapVehicleModel(item as Record<string, unknown>))
}

export async function listPublicServices(
  slug: string,
  params?: { categoryId?: string; vehicleId?: string; page?: number; pageSize?: number },
): Promise<PaginatedResult<PublicService>> {
  const envelope = await apiClient.get(
    `/v1/discovery/businesses/${slug}/services${buildQuery({
      categoryId: params?.categoryId,
      vehicleId: params?.vehicleId,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 50,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return {
    items: (envelope.data ?? []).map((item) => mapPublicService(item as Record<string, unknown>)),
    pagination: envelope.meta?.pagination,
  }
}

export async function listPublicProducts(
  slug: string,
  params?: { categoryId?: string; vehicleId?: string; page?: number; pageSize?: number },
): Promise<PaginatedResult<PublicProduct>> {
  const envelope = await apiClient.get(
    `/v1/discovery/businesses/${slug}/products${buildQuery({
      categoryId: params?.categoryId,
      vehicleId: params?.vehicleId,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 50,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return {
    items: (envelope.data ?? []).map((item) => mapPublicProduct(item as Record<string, unknown>)),
    pagination: envelope.meta?.pagination,
  }
}

export async function listBusinessReviews(
  businessId: string,
  params?: { page?: number; pageSize?: number; sort?: string; minimumRating?: number },
) {
  const envelope = await apiClient.get(
    `/v1/businesses/${businessId}/reviews${buildQuery({
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
      sort: params?.sort ?? 'newest',
      minimumRating: params?.minimumRating,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return envelope
}
