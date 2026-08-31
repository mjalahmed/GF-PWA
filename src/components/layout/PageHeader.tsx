import { Link } from 'react-router-dom'
import { IconChevron } from '../icons/NavIcons'
import { useLocale } from '../../i18n/LocaleProvider'

interface PageHeaderProps {
  title: string
  backTo?: string
  action?: React.ReactNode
}

export function PageHeader({ title, backTo, action }: PageHeaderProps) {
  const { t } = useLocale()

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        {backTo && (
          <Link
            to={backTo}
            className="touch-target -ms-2 flex items-center text-primary"
            aria-label={t('common.back')}
          >
            <IconChevron className="size-5 rotate-180 rtl:rotate-0" />
          </Link>
        )}
        <h1 className="flex-1 truncate text-lg font-semibold text-text-primary">{title}</h1>
        {action}
      </div>
    </header>
  )
}
