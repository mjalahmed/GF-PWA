import { useRef, useState } from 'react'
import { Button } from './Button'
import { StorageImage } from './StorageImage'
import { useLocale } from '../../i18n/LocaleProvider'

type ImageUploadProps = {
  bucket: string
  buildPath: (file: File) => string
  value?: string | null
  onChange: (path: string | null) => void
  onUpload: (file: File, path: string) => Promise<void>
  onRemove?: (path: string) => Promise<void> | void
  label?: string
  className?: string
}

export function ImageUpload({
  bucket,
  buildPath,
  value,
  onChange,
  onUpload,
  onRemove,
  label,
  className = '',
}: ImageUploadProps) {
  const { t } = useLocale()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError(t('upload.imageOnly'))
      return
    }
    setError('')
    setUploading(true)
    try {
      const path = buildPath(file)
      await onUpload(file, path)
      onChange(path)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('upload.failed'))
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!value) return
    setError('')
    setRemoving(true)
    try {
      await onRemove?.(value)
      onChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('upload.failed'))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={className}>
      {label && <p className="mb-1.5 text-sm font-medium text-text-secondary">{label}</p>}
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <StorageImage bucket={bucket} path={value} alt="" className="aspect-video w-full object-cover" />
          <div className="absolute bottom-2 end-2 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {t('upload.change')}
            </Button>
            {onRemove && (
              <Button type="button" variant="danger" loading={removing} onClick={() => void handleRemove()}>
                {t('common.remove')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-secondary text-sm text-text-muted"
        >
          {uploading ? t('common.loading') : t('upload.addPhoto')}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  )
}
