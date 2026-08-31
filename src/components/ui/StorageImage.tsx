import { publicStorageUrl } from '../../lib/storage'

interface StorageImageProps {
  bucket: string
  path?: string
  alt: string
  className?: string
  fallback?: string
}

export function StorageImage({ bucket, path, alt, className, fallback }: StorageImageProps) {
  if (!path) {
    return (
      <div className={className ?? 'flex size-full items-center justify-center bg-primary-light text-primary'}>
        {fallback ?? alt.charAt(0)}
      </div>
    )
  }
  return (
    <img
      src={publicStorageUrl(bucket, path)}
      alt={alt}
      className={className ?? 'size-full object-cover'}
      loading="lazy"
    />
  )
}
