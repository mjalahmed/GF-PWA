import type { ComponentType, SVGProps } from 'react'
import { NavLink } from 'react-router-dom'
import { GarageFinderLogo } from '../brand/GarageFinderLogo'
import {
  IconCalendar,
  IconInvoice,
  IconProfile,
  IconSearch,
} from '../icons/NavIcons'
import { useLocale } from '../../i18n/LocaleProvider'
import { cn } from '../../lib/utils'

const tabs: {
  to: string
  labelKey: string
  Icon?: ComponentType<SVGProps<SVGSVGElement>>
  brand?: boolean
}[] = [
  { to: '/', labelKey: 'nav.home', brand: true },
  { to: '/search', labelKey: 'nav.search', Icon: IconSearch },
  { to: '/appointments', labelKey: 'nav.appointments', Icon: IconCalendar },
  { to: '/invoices', labelKey: 'nav.invoices', Icon: IconInvoice },
  { to: '/profile', labelKey: 'nav.profile', Icon: IconProfile },
]

export function BottomNav() {
  const { t } = useLocale()

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map(({ to, labelKey, Icon, brand }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors sm:text-xs',
                isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary',
              )
            }
          >
            {brand ? (
              <GarageFinderLogo height={20} className="rounded-md" />
            ) : (
              Icon && <Icon className="size-5" />
            )}
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
