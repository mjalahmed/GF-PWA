const VIN_CHARSET = 'A-HJ-NPR-Z0-9'
const VIN_PATTERN = new RegExp(`^[${VIN_CHARSET}]{17}$`)

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
}

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

/** Uppercase, drop characters that can never appear in a VIN (I, O, Q and symbols), cap at 17. */
export function normalizeVin(input: string): string {
  return (input ?? '')
    .toUpperCase()
    .replace(new RegExp(`[^${VIN_CHARSET}]`, 'g'), '')
    .slice(0, 17)
}

export function isCompleteVin(input: string): boolean {
  return VIN_PATTERN.test(normalizeVin(input))
}

/** ISO 3779 check digit (position 9). Not all regions enforce it, so use as a confidence signal only. */
export function passesVinCheckDigit(input: string): boolean {
  const vin = normalizeVin(input)
  if (!VIN_PATTERN.test(vin)) return false
  let sum = 0
  for (let i = 0; i < 17; i += 1) {
    const char = vin[i]
    const value = /[0-9]/.test(char) ? Number(char) : TRANSLITERATION[char]
    if (value === undefined) return false
    sum += value * WEIGHTS[i]
  }
  const remainder = sum % 11
  const expected = remainder === 10 ? 'X' : String(remainder)
  return vin[8] === expected
}

function firstVinInToken(token: string): string | null {
  for (let i = 0; i + 17 <= token.length; i += 1) {
    const candidate = token.slice(i, i + 17)
    if (VIN_PATTERN.test(candidate)) return candidate
  }
  return null
}

/** Pull the first plausible 17-character VIN out of arbitrary text (barcode payload or OCR output). */
export function findVinInText(text: string): string | null {
  const upper = (text ?? '').toUpperCase()
  for (const token of upper.split(/[^A-Z0-9]+/)) {
    if (token.length < 17) continue
    const direct = firstVinInToken(token)
    if (direct) return direct
  }
  const compact = upper.replace(/[^A-Z0-9]/g, '')
  const embedded = firstVinInToken(compact)
  if (embedded) return embedded
  for (const token of upper.split(/\s+/)) {
    const candidate = normalizeVin(token)
    if (isCompleteVin(candidate)) return candidate
  }
  return null
}

export function pickBestVin(candidates: string[]): string | null {
  const found = candidates
    .map((value) => findVinInText(value))
    .filter((value): value is string => value !== null)
  if (found.length === 0) return null
  return found.find(passesVinCheckDigit) ?? found[0]
}
