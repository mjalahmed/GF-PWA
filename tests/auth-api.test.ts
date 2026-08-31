import { describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      verifyOtp: vi.fn(),
    },
  },
}))

const mockGet = vi.fn()
const mockPatch = vi.fn()

vi.mock('../src/services/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
  },
}))

describe('auth API paths', () => {
  it('getCurrentProfile calls /v1/profiles/me', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: 'u1', full_name: 'Test User' },
    })
    const { getCurrentProfile } = await import('../src/services/api/auth')
    const profile = await getCurrentProfile()
    expect(mockGet).toHaveBeenCalledWith('/v1/profiles/me', expect.any(Function))
    expect(profile?.fullName).toBe('Test User')
  })

  it('updateProfile patches /v1/profiles/me', async () => {
    mockPatch.mockResolvedValueOnce({
      data: { id: 'u1', full_name: 'Updated' },
    })
    const { updateProfile } = await import('../src/services/api/auth')
    const profile = await updateProfile({ fullName: 'Updated' })
    expect(mockPatch).toHaveBeenCalledWith('/v1/profiles/me', { fullName: 'Updated' }, expect.any(Function))
    expect(profile.fullName).toBe('Updated')
  })

  it('getMyRoles calls /v1/me', async () => {
    mockGet.mockResolvedValueOnce({ data: { roles: ['customer'] } })
    const { getMyRoles } = await import('../src/services/api/auth')
    const roles = await getMyRoles()
    expect(mockGet).toHaveBeenCalledWith('/v1/me', expect.any(Function))
    expect(roles).toEqual(['customer'])
  })
})
