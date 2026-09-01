import { supabase } from './supabase'

export type UploadResult = {
  bucket: string
  path: string
}

export async function uploadImage(
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

export function vehicleImagePath(userId: string, vehicleId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${vehicleId}/${Date.now()}-${safe}`
}

export function quoteRequestImagePath(userId: string, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/quotes/${Date.now()}-${safe}`
}
