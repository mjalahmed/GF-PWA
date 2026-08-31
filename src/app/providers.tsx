import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AuthProvider } from '../hooks/useAuth'
import { LanguageGate } from '../i18n/LanguageGate'
import { LocaleProvider } from '../i18n/LocaleProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocaleProvider>
          <LanguageGate>{children}</LanguageGate>
        </LocaleProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
