import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/search', label: 'Search', icon: '🔍' },
  { to: '/appointments', label: 'Appointments', icon: '📅' },
  { to: '/invoices', label: 'Invoices', icon: '🧾' },
  { to: '/profile', label: 'Profile', icon: '👤' },
] as const

export function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map(({ to, label, icon }) => (
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
            <span className="text-lg leading-none" aria-hidden>
              {icon}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
