import type { PaginatedResult } from '../../types/api'
import type { CatalogCategory, CatalogItem, VehicleMake, VehicleModel } from '../../types/catalog'
import { mapCatalogCategory, mapCatalogItem, mapVehicleMake, mapVehicleModel } from '../../lib/mappers'
import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listServiceCategories(): Promise<CatalogCategory[]> {
  const envelope = await apiClient.get(customerPaths.catalog.serviceCategories, (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []).map((item) => mapCatalogCategory(item as Record<string, unknown>))
}

export async function listProductCategories(): Promise<CatalogCategory[]> {
  const envelope = await apiClient.get(customerPaths.catalog.productCategories, (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []).map((item) => mapCatalogCategory(item as Record<string, unknown>))
}

export async function listVehicleMakes(): Promise<VehicleMake[]> {
  const envelope = await apiClient.get(customerPaths.catalog.vehicleMakes, (json) => (Array.isArray(json) ? json : []))
  return (envelope.data ?? []).map((item) => mapVehicleMake(item as Record<string, unknown>))
}

export async function listVehicleModels(makeId: string): Promise<VehicleModel[]> {
  const envelope = await apiClient.get(customerPaths.catalog.vehicleModels(makeId), (json) =>
    Array.isArray(json) ? json : [],
  )
  return (envelope.data ?? []).map((item) => mapVehicleModel(item as Record<string, unknown>))
}

export async function listPublicServices(
  slug: string,
  params?: { categoryId?: string; page?: number; pageSize?: number },
): Promise<PaginatedResult<CatalogItem>> {
  const envelope = await apiClient.get(
    `${customerPaths.discovery.services(slug)}${buildQuery({
      categoryId: params?.categoryId,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return {
    items: (envelope.data ?? []).map((item) => mapCatalogItem(item as Record<string, unknown>)),
    pagination: envelope.meta?.pagination,
  }
}

export async function listPublicProducts(
  slug: string,
  params?: { categoryId?: string; page?: number; pageSize?: number },
): Promise<PaginatedResult<CatalogItem>> {
  const envelope = await apiClient.get(
    `${customerPaths.discovery.products(slug)}${buildQuery({
      categoryId: params?.categoryId,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return {
    items: (envelope.data ?? []).map((item) => mapCatalogItem(item as Record<string, unknown>)),
    pagination: envelope.meta?.pagination,
  }
}

export async function listBusinessReviews(
  businessId: string,
  params?: { page?: number; pageSize?: number },
): Promise<PaginatedResult<Record<string, unknown>>> {
  const envelope = await apiClient.get(
    `${customerPaths.businessReviews(businessId)}${buildQuery({
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 10,
    })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return {
    items: (envelope.data ?? []) as Record<string, unknown>[],
    pagination: envelope.meta?.pagination,
  }
}
