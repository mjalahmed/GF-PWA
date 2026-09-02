import { useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentProfile, getMyRoles } from '../services/api/auth'
import type { Profile } from '../types/discovery'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    const { data } = await supabase.auth.getSession()
    setSession(data.session)
    if (data.session) {
      try {
        const [p, r] = await Promise.all([getCurrentProfile(), getMyRoles()])
        setProfile(p)
        setRoles(r)
      } catch {
        setProfile(null)
        setRoles([])
      }
    } else {
      setProfile(null)
      setRoles([])
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, profile, roles, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
