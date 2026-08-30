import { describe, expect, it } from 'vitest'
import { userMessage, ErrorCodes } from '../src/lib/error-codes'

describe('userMessage', () => {
  it('returns mapped message for known codes', () => {
    expect(userMessage(ErrorCodes.AUTH_REQUIRED)).toBe('You must be signed in to continue.')
  })

  it('falls back to internal error', () => {
    expect(userMessage('UNKNOWN_CODE')).toBe('Something went wrong. Please try again.')
  })

  it('uses custom fallback when provided', () => {
    expect(userMessage('UNKNOWN', 'Custom message')).toBe('Custom message')
  })
})
