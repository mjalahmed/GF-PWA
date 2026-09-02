import { getApiBaseUrl, env } from '../../lib/env'
import { supabase } from '../../lib/supabase'
import type { ApiEnvelope } from '../../types/api'
import { ApiException } from '../../types/api'

function newRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

async function headers(jsonBody = false, idempotencyKey?: string): Promise<HeadersInit> {
  const session = (await supabase.auth.getSession()).data.session
  const token = session?.access_token
  const h: Record<string, string> = {
    Accept: 'application/json',
    'X-Request-ID': newRequestId(),
    apikey: env.supabaseAnonKey,
  }
  if (token) h.Authorization = `Bearer ${token}`
  if (jsonBody) h['Content-Type'] = 'application/json'
  if (idempotencyKey) h['Idempotency-Key'] = idempotencyKey
  return h
}

function uri(path: string): string {
  const base = getApiBaseUrl()
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

async function parseEnvelope<T>(response: Response, decode: (json: unknown) => T): Promise<ApiEnvelope<T>> {
  const body = (await response.text()).trim()
  const raw = body ? JSON.parse(body) : { success: true, data: {}, error: null, meta: { requestId: '' } }
  if (!raw.success) {
    throw new ApiException(
      raw.error?.code ?? 'INTERNAL_ERROR',
      raw.error?.message ?? 'Something went wrong.',
      response.status,
      raw.error?.details,
    )
  }
  return {
    success: true,
    data: decode(raw.data),
    error: null,
    meta: raw.meta ?? null,
  }
}

async function send<T>(
  request: () => Promise<Response>,
  decode: (json: unknown) => T,
  retried = false,
): Promise<ApiEnvelope<T>> {
  const response = await request()
  if (response.status === 401 && !retried) {
    await supabase.auth.refreshSession()
    return send(request, decode, true)
  }
  return parseEnvelope(response, decode)
}

export const apiClient = {
  get<T>(path: string, decode: (json: unknown) => T) {
    return send(async () => fetch(uri(path), { headers: await headers() }), decode)
  },
  post<T>(path: string, body: Record<string, unknown>, decode: (json: unknown) => T, idempotencyKey?: string) {
    return send(
      async () =>
        fetch(uri(path), {
          method: 'POST',
          headers: await headers(true, idempotencyKey),
          body: JSON.stringify(body),
        }),
      decode,
    )
  },
  patch<T>(path: string, body: Record<string, unknown>, decode: (json: unknown) => T) {
    return send(
      async () =>
        fetch(uri(path), {
          method: 'PATCH',
          headers: await headers(true),
          body: JSON.stringify(body),
        }),
      decode,
    )
  },
  put<T>(path: string, body: Record<string, unknown>, decode: (json: unknown) => T) {
    return send(
      async () =>
        fetch(uri(path), {
          method: 'PUT',
          headers: await headers(true),
          body: JSON.stringify(body),
        }),
      decode,
    )
  },
  delete<T>(path: string, decode: (json: unknown) => T) {
    return send(async () => fetch(uri(path), { method: 'DELETE', headers: await headers() }), decode)
  },
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

export { buildQuery }
