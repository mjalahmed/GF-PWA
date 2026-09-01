import { StorageImage } from './StorageImage'
import { useLocale } from '../../i18n/LocaleProvider'

export type RepairPhoto = {
  id: string
  phase: 'before' | 'during' | 'after'
  storagePath: string
  caption?: string | null
}

type BeforeAfterGalleryProps = {
  photos: RepairPhoto[]
}

const PHASES: RepairPhoto['phase'][] = ['before', 'after', 'during']

export function BeforeAfterGallery({ photos }: BeforeAfterGalleryProps) {
  const { t } = useLocale()
  if (!photos.length) return null

  return (
    <div className="space-y-4">
      {PHASES.map((phase) => {
        const group = photos.filter((p) => p.phase === phase)
        if (!group.length) return null
        const label =
          phase === 'before'
            ? t('repair.before')
            : phase === 'after'
              ? t('repair.after')
              : t('repair.during')
        return (
          <div key={phase}>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{label}</h3>
            <div className="grid grid-cols-2 gap-2">
              {group.map((photo) => (
                <figure key={photo.id} className="overflow-hidden rounded-xl border border-border">
                  <StorageImage
                    bucket="repair-photos"
                    path={photo.storagePath}
                    alt={photo.caption ?? label}
                    className="aspect-square w-full object-cover"
                  />
                  {photo.caption && (
                    <figcaption className="p-2 text-xs text-text-muted">{photo.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
