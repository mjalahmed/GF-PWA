import type { PaginatedResult } from '../../types/api'
import type { CategoryRef, PublicProduct, PublicService, VehicleMake, VehicleModel } from '../../types/catalog'
import type { Review } from '../../types/reviews'
import {
  mapCategoryRef,
  mapPublicProduct,
  mapPublicService,
  mapReview,
  mapVehicleMake,
  mapVehicleModel,
} from '../../lib/mappers'
import { mapList } from '../../lib/map'
import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listServiceCategories(): Promise<CategoryRef[]> {
  const envelope = await apiClient.get(customerPaths.catalog.serviceCategories, (json) => json)
  return mapList(envelope.data, mapCategoryRef)
}

export async function listProductCategories(): Promise<CategoryRef[]> {
  const envelope = await apiClient.get(customerPaths.catalog.productCategories, (json) => json)
  return mapList(envelope.data, mapCategoryRef)
}

export async function listVehicleMakes(): Promise<VehicleMake[]> {
  const envelope = await apiClient.get(customerPaths.catalog.vehicleMakes, (json) => json)
  return mapList(envelope.data, mapVehicleMake)
}

export async function listVehicleModels(makeId: string): Promise<VehicleModel[]> {
  const envelope = await apiClient.get(customerPaths.catalog.vehicleModels(makeId), (json) => json)
  return mapList(envelope.data, mapVehicleModel)
}

export async function listPublicServices(
  slug: string,
  params?: { categoryId?: string; page?: number; pageSize?: number },
): Promise<PaginatedResult<PublicService>> {
  const envelope = await apiClient.get(
    `${customerPaths.discovery.services(slug)}${buildQuery({
      categoryId: params?.categoryId,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
    (json) => json,
  )
  return {
    items: mapList(envelope.data, mapPublicService),
    pagination: envelope.meta?.pagination,
  }
}

export async function listPublicProducts(
  slug: string,
  params?: { categoryId?: string; page?: number; pageSize?: number },
): Promise<PaginatedResult<PublicProduct>> {
  const envelope = await apiClient.get(
    `${customerPaths.discovery.products(slug)}${buildQuery({
      categoryId: params?.categoryId,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
    (json) => json,
  )
  return {
    items: mapList(envelope.data, mapPublicProduct),
    pagination: envelope.meta?.pagination,
  }
}

export async function listBusinessReviews(
  businessId: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResult<Review>> {
  const envelope = await apiClient.get(
    `${customerPaths.businessReviews(businessId)}${buildQuery({
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    })}`,
    (json) => json,
  )
  return {
    items: mapList(envelope.data, mapReview),
    pagination: envelope.meta?.pagination,
  }
}
