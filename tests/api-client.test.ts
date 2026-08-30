import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildQuery } from '../src/services/api/client'

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      refreshSession: vi.fn(),
    },
  },
}))

describe('buildQuery', () => {
  it('builds query string from params', () => {
    expect(buildQuery({ page: 1, query: 'oil change', empty: '' })).toBe('?page=1&query=oil%20change')
  })

  it('omits null and undefined values', () => {
    expect(buildQuery({ a: null, b: undefined, c: 'yes' })).toBe('?c=yes')
  })

  it('returns empty string when no params', () => {
    expect(buildQuery({})).toBe('')
  })
})

describe('getApiBaseUrl', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('prefers explicit API URL', async () => {
    vi.stubEnv('VITE_GARAGEFINDER_API_URL', 'https://api.example.com/v1/')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://supabase.example.com')
    const { getApiBaseUrl } = await import('../src/lib/env')
    expect(getApiBaseUrl()).toBe('https://api.example.com/v1')
    vi.unstubAllEnvs()
  })
})
