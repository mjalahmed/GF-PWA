import { apiClient } from './client'
import { customerPaths } from './paths'

export async function listFavorites(): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(customerPaths.favorites, (json) => (Array.isArray(json) ? json : []))
  return (envelope.data ?? []) as Record<string, unknown>[]
}

export async function addFavorite(businessId: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(customerPaths.favorite(businessId), {}, (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function removeFavorite(businessId: string): Promise<void> {
  await apiClient.delete(customerPaths.favorite(businessId), () => ({}))
}
