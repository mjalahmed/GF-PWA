import type { FavoriteBusiness } from '../../types/discovery'
import { mapFavorite } from '../../lib/mappers'
import { mapList } from '../../lib/map'
import { apiClient } from './client'
import { customerPaths } from './paths'

export async function listFavorites(): Promise<FavoriteBusiness[]> {
  const envelope = await apiClient.get(customerPaths.favorites, (json) => json)
  return mapList(envelope.data, mapFavorite)
}

export async function addFavorite(businessId: string): Promise<FavoriteBusiness> {
  const envelope = await apiClient.post(
    customerPaths.favorite(businessId),
    {},
    (json) => json as Record<string, unknown>,
  )
  return mapFavorite(envelope.data!)
}

export async function removeFavorite(businessId: string): Promise<void> {
  await apiClient.delete(customerPaths.favorite(businessId), () => ({}))
}
