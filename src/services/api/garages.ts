import type { DiscoveryBusiness } from '../../types/discovery'
import type { PaginatedResult } from '../../types/api'
import { apiClient, buildQuery } from './client'

function mapBusiness(raw: Record<string, unknown>): DiscoveryBusiness {
  return {
    id: String(raw.id),
    slug: String(raw.slug),
    displayName: String(raw.displayName ?? raw.display_name),
    description: (raw.description as string) ?? undefined,
    logoPath: (raw.logoPath ?? raw.logo_path) as string | undefined,
    coverPath: (raw.coverPath ?? raw.cover_path) as string | undefined,
    businessCategoryId: String(raw.businessCategoryId ?? raw.business_category_id),
    verificationStatus: String(raw.verificationStatus ?? raw.verification_status),
    averageRating: Number(raw.averageRating ?? raw.average_rating ?? 0),
    ratingCount: Number(raw.ratingCount ?? raw.rating_count ?? 0),
    areas: Array.isArray(raw.areas) ? raw.areas.map(String) : [],
    branches: Array.isArray(raw.branches)
      ? raw.branches.map((b) => {
          const br = b as Record<string, unknown>
          return {
            id: String(br.id),
            name: String(br.name),
            phone: br.phone as string | undefined,
            addressLine: String(br.addressLine ?? br.address_line),
            area: br.area as string | undefined,
            city: br.city as string | undefined,
            countryCode: String(br.countryCode ?? br.country_code ?? 'BH'),
            latitude: br.latitude != null ? Number(br.latitude) : undefined,
            longitude: br.longitude != null ? Number(br.longitude) : undefined,
            timezone: String(br.timezone ?? 'Asia/Bahrain'),
            isPrimary: Boolean(br.isPrimary ?? br.is_primary),
          }
        })
      : [],
    openingState: raw.openingState ?? raw.opening_state
      ? (() => {
          const o = (raw.openingState ?? raw.opening_state) as Record<string, unknown>
          return {
            isOpen: Boolean(o.isOpen ?? o.is_open),
            branchId: o.branchId as string | undefined,
            branchName: o.branchName as string | undefined,
          }
        })()
      : undefined,
    serviceCount: Number(raw.serviceCount ?? raw.service_count ?? 0),
    productCount: Number(raw.productCount ?? raw.product_count ?? 0),
    distanceKm: raw.distanceKm != null ? Number(raw.distanceKm ?? raw.distance_km) : undefined,
  }
}

export async function searchBusinesses(params: {
  query?: string
  city?: string
  area?: string
  sort?: string
  page?: number
  pageSize?: number
  latitude?: number
  longitude?: number
}): Promise<PaginatedResult<DiscoveryBusiness>> {
  const envelope = await apiClient.get(
    `/v1/discovery/businesses${buildQuery({
      query: params.query,
      city: params.city,
      area: params.area,
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
    `/v1/discovery/businesses/${slug}${buildQuery({
      latitude: coords?.latitude,
      longitude: coords?.longitude,
    })}`,
    (json) => json as Record<string, unknown>,
  )
  return mapBusiness(envelope.data!)
}
