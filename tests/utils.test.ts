import { describe, expect, it } from 'vitest'
import {
  formatDate,
  formatDistance,
  formatMoney,
  formatRating,
  formatStatus,
  primaryBranch,
  vehicleLabel,
} from '../src/lib/utils'

describe('formatDistance', () => {
  it('formats meters under 1 km', () => {
    expect(formatDistance(0.5)).toBe('500 m away')
  })

  it('formats kilometers', () => {
    expect(formatDistance(2.34)).toBe('2.3 km away')
  })

  it('returns empty for undefined', () => {
    expect(formatDistance(undefined)).toBe('')
  })
})

describe('formatRating', () => {
  it('shows no reviews message', () => {
    expect(formatRating(0, 0)).toBe('No reviews yet')
  })

  it('formats rating with count', () => {
    expect(formatRating(4.5, 12)).toBe('4.5 (12)')
  })
})

describe('formatStatus', () => {
  it('title-cases snake_case', () => {
    expect(formatStatus('pending_confirmation')).toBe('Pending Confirmation')
  })
})

describe('formatMoney', () => {
  it('formats BHD amounts with three decimals', () => {
    expect(formatMoney(12.5)).toBe('12.500 BHD')
  })
})

describe('vehicleLabel', () => {
  it('uses displayLabel when present', () => {
    expect(vehicleLabel({ year: 2020, displayLabel: 'My Camry' })).toBe('My Camry')
  })

  it('builds label from make/model/year', () => {
    expect(vehicleLabel({ year: 2020, makeText: 'Toyota', modelText: 'Camry' })).toBe('2020 Toyota Camry')
  })
})

describe('formatDate', () => {
  it('returns a localized string', () => {
    const result = formatDate('2026-01-15T10:30:00.000Z')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('primaryBranch', () => {
  it('returns primary branch when marked', () => {
    const business = {
      branches: [
        { isPrimary: false, id: '1' },
        { isPrimary: true, id: '2' },
      ],
    }
    expect(primaryBranch(business)?.id).toBe('2')
  })

  it('falls back to first branch', () => {
    const business = {
      branches: [{ isPrimary: false, id: '1' }],
    }
    expect(primaryBranch(business)?.id).toBe('1')
  })
})
