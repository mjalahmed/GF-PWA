import { env } from './env'

export function publicStorageUrl(bucket: string, storagePath: string): string {
  const base = env.supabaseUrl.replace(/\/$/, '')
  if (!base || !storagePath) return storagePath
  const encoded = storagePath.split('/').map(encodeURIComponent).join('/')
  return `${base}/storage/v1/object/public/${bucket}/${encoded}`
}
