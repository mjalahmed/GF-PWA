/** Map API JSON fields supporting camelCase and snake_case. */
export function pick<T>(raw: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null) return raw[k] as T
  }
  return undefined
}

export function pickNum(raw: Record<string, unknown>, ...keys: string[]): number | undefined {
  const v = pick<number | string>(raw, ...keys)
  if (v == null) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export function pickBool(raw: Record<string, unknown>, ...keys: string[]): boolean {
  const v = pick<boolean | string | number>(raw, ...keys)
  if (v === true || v === 'true' || v === 1) return true
  return false
}

export function mapList<T>(
  raw: unknown,
  mapper: (item: Record<string, unknown>) => T,
): T[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => mapper(item as Record<string, unknown>))
}
