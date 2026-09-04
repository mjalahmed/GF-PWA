type GarageFinderLogoProps = {
  className?: string
  /** Image height in pixels (width scales). Default 40. */
  height?: number
  alt?: string
}

/** Brand mark for auth and app shells. Uses icon-192 for lightweight load. */
export function GarageFinderLogo({
  className,
  height = 40,
  alt = 'GarageFinder',
}: GarageFinderLogoProps) {
  return (
    <img
      src="/icons/icon-192.png"
      alt={alt}
      width={height}
      height={height}
      className={className}
      decoding="async"
    />
  )
}
