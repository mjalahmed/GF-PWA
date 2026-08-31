import type { FavoriteBusiness } from '../../types/discovery'
import { mapFavorite } from '../../lib/mappers'
import { apiClient } from './client'

export async function listFavorites(): Promise<FavoriteBusiness[]> {
  const envelope = await apiClient.get('/v1/favorites', (json) => (Array.isArray(json) ? json : []))
  return (envelope.data ?? []).map((item) => mapFavorite(item as Record<string, unknown>))
}

export async function addFavorite(businessId: string): Promise<FavoriteBusiness> {
  const envelope = await apiClient.post('/v1/favorites/' + businessId, {}, (json) => json as Record<string, unknown>)
  return mapFavorite(envelope.data!)
}

export async function removeFavorite(businessId: string): Promise<void> {
  await apiClient.delete(`/v1/favorites/${businessId}`, () => ({}))
}
