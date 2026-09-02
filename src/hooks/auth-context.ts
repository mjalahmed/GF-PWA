import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../types/discovery'

export interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  roles: string[]
  loading: boolean
  refresh: () => Promise<void>
}

/** Kept in its own module so Vite HMR does not recreate the context object. */
export const AuthContext = createContext<AuthContextValue | null>(null)
