/**
 * Motomarks car logo helpers — local static assets.
 * Files live at: public/vehicle-logos/{slug}.webp
 * Download/refresh via: npm run logos:download
 */
import { MOTOMARKS_SLUGS } from './slugs'

const ALIASES: Record<string, string> = {
  'mercedes-benz': 'mercedes-benz',
  mercedes: 'mercedes-benz',
  'land-rover': 'land-rover',
  'range-rover': 'land-rover',
  'alfa-romeo': 'alfa-romeo',
  vw: 'volkswagen',
  'general-motors': 'chevrolet',
  'rolls-royce': 'rolls-royce',
  'aston-martin': 'aston-martin',
}

export function toMotomarksSlug(nameOrSlug: string | null | undefined): string | null {
  if (!nameOrSlug?.trim()) return null
  const raw = nameOrSlug
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!raw) return null
  const aliased = ALIASES[raw] ?? raw
  return MOTOMARKS_SLUGS.has(aliased) ? aliased : null
}

export function hasMotomarksLogo(nameOrSlug: string | null | undefined): boolean {
  return toMotomarksSlug(nameOrSlug) != null
}

/** Local static URL — no CDN/token at runtime. */
export function motomarksLogoUrl(
  nameOrSlug: string | null | undefined,
  _options?: { type?: 'badge' | 'full' | 'wordmark'; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' },
): string | null {
  const slug = toMotomarksSlug(nameOrSlug)
  if (!slug) return null
  return `/vehicle-logos/${slug}.webp`
}
