import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocale } from '../../i18n/LocaleProvider'
import { cn } from '../../lib/utils'

export type SearchableOption = {
  value: string
  label: string
  searchText?: string
  disabled?: boolean
  leading?: ReactNode
}

type SearchableSelectProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SearchableOption[]
  placeholder?: string
  searchPlaceholder?: string
  required?: boolean
  disabled?: boolean
  emptyLabel?: string
  className?: string
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  required,
  disabled,
  emptyLabel,
  className,
}: SearchableSelectProps) {
  const { t } = useLocale()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => {
      const hay = `${o.label} ${o.searchText ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative block space-y-1.5', className)}>
      {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return
          setOpen((v) => !v)
          setQuery('')
        }}
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-start text-base text-text-primary disabled:opacity-50"
      >
        {selected?.leading}
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-text-muted')}>
          {selected?.label ?? placeholder ?? t('common.select')}
        </span>
        <span className="text-text-subtle" aria-hidden>
          ▾
        </span>
      </button>
      {required && <input tabIndex={-1} className="sr-only" value={value} required readOnly />}
      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-72 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="border-b border-border p-2">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder ?? t('common.search')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-text-muted">
                {emptyLabel ?? t('common.noResults')}
              </li>
            )}
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  disabled={opt.disabled}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2.5 text-start text-sm hover:bg-primary-light',
                    opt.value === value && 'bg-primary-light/60 font-medium text-primary',
                    opt.disabled && 'opacity-50',
                  )}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                    setQuery('')
                  }}
                >
                  {opt.leading}
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
