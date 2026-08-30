/** Public client configuration only. Never put service-role keys here. */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  apiUrl: import.meta.env.VITE_GARAGEFINDER_API_URL ?? '',
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
} as const

export function getApiBaseUrl(): string {
  if (env.apiUrl) return env.apiUrl.replace(/\/$/, '')
  if (env.supabaseUrl) {
    return `${env.supabaseUrl.replace(/\/$/, '')}/functions/v1/api`
  }
  return ''
}

export const isConfigured =
  env.supabaseUrl.length > 0 &&
  env.supabaseAnonKey.length > 0 &&
  env.supabaseAnonKey !== 'your-local-anon-key'

export const isDevelopment = env.appEnv === 'development'
