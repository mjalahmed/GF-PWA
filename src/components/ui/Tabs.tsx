import { cn } from '../../lib/utils'

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'shrink-0 px-4 py-2 text-sm font-medium transition-colors',
            active === tab.id
              ? 'border-b-2 border-primary text-primary'
              : 'text-text-muted hover:text-text-secondary',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
