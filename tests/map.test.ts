import { describe, expect, it } from 'vitest'
import { mapList, pick, pickBool, pickNum } from '../src/lib/map'

describe('pick', () => {
  it('returns first matching key', () => {
    expect(pick({ a: 1, b: 2 }, 'b', 'a')).toBe(2)
  })

  it('supports snake_case fallback', () => {
    expect(pick({ full_name: 'Ali' }, 'fullName', 'full_name')).toBe('Ali')
  })

  it('returns undefined when missing', () => {
    expect(pick({}, 'missing')).toBeUndefined()
  })
})

describe('pickNum', () => {
  it('parses numeric strings', () => {
    expect(pickNum({ price: '12.5' }, 'price')).toBe(12.5)
  })

  it('returns undefined for invalid numbers', () => {
    expect(pickNum({ price: 'n/a' }, 'price')).toBeUndefined()
  })
})

describe('pickBool', () => {
  it('handles boolean and string truthy values', () => {
    expect(pickBool({ flag: true }, 'flag')).toBe(true)
    expect(pickBool({ flag: 'true' }, 'flag')).toBe(true)
    expect(pickBool({ flag: 1 }, 'flag')).toBe(true)
    expect(pickBool({ flag: false }, 'flag')).toBe(false)
  })
})

describe('mapList', () => {
  it('maps arrays safely', () => {
    const result = mapList([{ id: '1' }, { id: '2' }], (r) => String(r.id))
    expect(result).toEqual(['1', '2'])
  })

  it('returns empty array for non-arrays', () => {
    expect(mapList(null, (r) => String(r.id))).toEqual([])
  })
})
