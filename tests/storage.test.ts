import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('publicStorageUrl', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co')
  })

  it('builds public storage URL from bucket and path', async () => {
    const { publicStorageUrl } = await import('../src/lib/storage')
    const url = publicStorageUrl('business-logos', 'abc/logo.png')
    expect(url).toBe('https://project.supabase.co/storage/v1/object/public/business-logos/abc/logo.png')
  })

  it('encodes path segments', async () => {
    const { publicStorageUrl } = await import('../src/lib/storage')
    const url = publicStorageUrl('images', 'folder/my file.jpg')
    expect(url).toContain('my%20file.jpg')
  })
})
