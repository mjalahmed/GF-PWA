import { Link } from 'react-router-dom'
import { GarageFinderLogo } from '../brand/GarageFinderLogo'
import { IconChevron } from '../icons/NavIcons'
import { useLocale } from '../../i18n/LocaleProvider'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  action?: React.ReactNode
  /** Show brand logo beside the title (shells / empty headers). */
  brand?: boolean
}

export function PageHeader({ title, subtitle, backTo, action, brand }: PageHeaderProps) {
  const { t } = useLocale()

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        {backTo && (
          <Link
            to={backTo}
            className="touch-target -ms-2 flex items-center text-primary"
            aria-label={t('common.backAria')}
          >
            <IconChevron className="size-5 rotate-180 rtl:rotate-0" />
          </Link>
        )}
        {brand && (
          <Link to="/" className="shrink-0" aria-label="GarageFinder home">
            <GarageFinderLogo height={32} className="rounded-lg" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-text-primary">{title}</h1>
          {subtitle && <p className="truncate text-xs text-text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}
