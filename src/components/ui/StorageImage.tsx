import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { publicStorageUrl } from '../../lib/storage'

const PRIVATE_BUCKETS = new Set(['vehicle-images', 'repair-photos'])

interface StorageImageProps {
  bucket: string
  path?: string
  alt: string
  className?: string
  fallback?: string
}

export function StorageImage({ bucket, path, alt, className, fallback }: StorageImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!path || !PRIVATE_BUCKETS.has(bucket)) {
      setSignedUrl(null)
      return
    }
    let active = true
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (active) setSignedUrl(data?.signedUrl ?? null)
      })
      .catch(() => {
        if (active) setSignedUrl(null)
      })
    return () => {
      active = false
    }
  }, [bucket, path])

  if (!path) {
    return (
      <div className={className ?? 'flex size-full items-center justify-center bg-primary-light text-primary'}>
        {fallback ?? alt.charAt(0)}
      </div>
    )
  }

  const src = PRIVATE_BUCKETS.has(bucket)
    ? signedUrl ?? undefined
    : publicStorageUrl(bucket, path)

  if (!src) {
    return (
      <div className={className ?? 'flex size-full animate-pulse items-center justify-center bg-surface-secondary'} />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className ?? 'size-full object-cover'}
      loading="lazy"
    />
  )
}
