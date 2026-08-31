import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/discovery'
import { mapProfile } from '../../lib/mappers'
import { apiClient } from './client'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  preferredLanguage = 'en',
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, preferred_language: preferredLanguage } },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/verify?type=recovery`,
  })
  if (error) throw error
}

export async function verifyOtp(email: string, token: string, type: 'signup' | 'recovery' | 'email' = 'signup') {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type })
  if (error) throw error
  return data
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const envelope = await apiClient.get('/v1/profiles/me', (json) => json as Record<string, unknown>)
  const raw = envelope.data
  if (!raw) return null
  return mapProfile(raw)
}

export async function updateProfile(body: {
  fullName?: string
  phone?: string
  preferredLanguage?: string
}): Promise<Profile> {
  const envelope = await apiClient.patch('/v1/profiles/me', body, (json) => json as Record<string, unknown>)
  return mapProfile(envelope.data!)
}

export async function getMyRoles(): Promise<string[]> {
  const envelope = await apiClient.get('/v1/me', (json) => json as Record<string, unknown>)
  const roles = envelope.data?.roles
  if (Array.isArray(roles)) return roles.map(String)
  return []
}

export async function getCurrentUser() {
  const envelope = await apiClient.get('/v1/me', (json) => json as Record<string, unknown>)
  return envelope.data
}
