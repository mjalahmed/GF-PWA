import { supabase } from './supabase'

export type UploadResult = {
  bucket: string
  path: string
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<UploadResult> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) throw new Error(error.message)
  return { bucket, path }
}

export async function uploadImage(
  bucket: string,
  path: string,
  file: File,
): Promise<UploadResult> {
  return uploadFile(bucket, path, file)
}

export function vehicleImagePath(userId: string, vehicleId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${vehicleId}/${Date.now()}-${safe}`
}

export function quoteRequestImagePath(userId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/quotes/${Date.now()}-${safe}`
}

export function businessMediaPath(
  businessId: string,
  kind: 'logo' | 'cover' | 'gallery',
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${businessId}/${kind}/${Date.now()}-${safe}`
}

export function applicationMediaPath(
  applicationId: string,
  kind: 'logo' | 'gallery',
  fileName: string,
): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `applications/${applicationId}/${kind}/${Date.now()}-${safe}`
}

export async function removeStorageFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw new Error(error.message)
}
