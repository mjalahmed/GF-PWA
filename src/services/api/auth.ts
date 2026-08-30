import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/discovery'
import { apiClient } from './client'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const envelope = await apiClient.get('/v1/me/profile', (json) => json as Record<string, unknown>)
  const raw = envelope.data
  if (!raw) return null
  return {
    id: String(raw.id),
    fullName: (raw.fullName ?? raw.full_name) as string | null,
    phone: (raw.phone as string) ?? null,
    locale: (raw.locale as string) ?? null,
    isSuspended: Boolean(raw.isSuspended ?? raw.is_suspended),
  }
}

export async function getMyRoles(): Promise<string[]> {
  const envelope = await apiClient.get('/v1/me/roles', (json) => json)
  if (Array.isArray(envelope.data)) return envelope.data.map(String)
  return []
}
