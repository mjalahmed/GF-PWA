import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
          error && 'border-error focus:border-error focus:ring-error/20',
          className,
        )}
        {...props}
      />
      {error && <span className="text-sm text-error">{error}</span>}
    </label>
  )
}
