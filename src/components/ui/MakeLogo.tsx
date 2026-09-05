import { motomarksLogoUrl } from '../../lib/motomarks'

type MakeLogoProps = {
  make?: string | null
  slug?: string | null
  alt?: string
  className?: string
  size?: number
}

export function MakeLogo({ make, slug, alt, className = '', size = 28 }: MakeLogoProps) {
  const src = motomarksLogoUrl(slug || make, { type: 'badge', size: size <= 32 ? 'xs' : 'sm' })
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt ?? make ?? ''}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 rounded-md bg-white object-contain p-0.5 ${className}`}
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
      }}
    />
  )
}
