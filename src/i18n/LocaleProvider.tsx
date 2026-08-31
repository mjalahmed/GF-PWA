import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { updateProfile } from '../services/api/auth'
import { useAuth } from '../hooks/useAuth'
import {
  applyDocumentLocale,
  readStoredLocale,
  writeStoredLocale,
  type Locale,
} from './locale'
import { translate, type MessageKey } from './messages'

interface LocaleContextValue {
  locale: Locale | null
  ready: boolean
  hasChosenLocale: boolean
  setLocale: (locale: Locale) => Promise<void>
  t: (key: MessageKey) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [locale, setLocaleState] = useState<Locale | null>(() => readStoredLocale())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = readStoredLocale()
    setLocaleState(stored)
    if (stored) applyDocumentLocale(stored)
    setReady(true)
  }, [])

  const setLocale = useCallback(
    async (next: Locale) => {
      writeStoredLocale(next)
      applyDocumentLocale(next)
      setLocaleState(next)
      if (session) {
        try {
          await updateProfile({ preferredLanguage: next })
        } catch {
          // UI language still updates even if profile sync fails
        }
      }
    },
    [session],
  )

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      ready,
      hasChosenLocale: locale != null,
      setLocale,
      t: (key) => translate(locale ?? 'en', key),
    }),
    [locale, ready, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
