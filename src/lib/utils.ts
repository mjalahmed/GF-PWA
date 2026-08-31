export function formatDistance(km: number | undefined): string {
  if (km == null) return ''
  if (km < 1) return `${Math.round(km * 1000)} m away`
  return `${km.toFixed(1)} km away`
}

export function formatRating(rating: number, count: number): string {
  if (count === 0) return 'No reviews yet'
  return `${rating.toFixed(1)} (${count})`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatMoney(amount: number, currency = 'BHD'): string {
  return `${amount.toFixed(3)} ${currency}`
}

export function vehicleLabel(v: {
  year: number
  makeText?: string
  modelText?: string
  displayLabel?: string
}): string {
  if (v.displayLabel) return v.displayLabel
  return `${v.year} ${v.makeText ?? ''} ${v.modelText ?? ''}`.trim() || 'Vehicle'
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function primaryBranch<T extends { branches: { isPrimary: boolean }[] }>(
  business: T,
): T['branches'][number] | undefined {
  return business.branches.find((b) => b.isPrimary) ?? business.branches[0]
}
