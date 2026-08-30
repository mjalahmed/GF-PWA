import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark disabled:bg-primary/50',
  secondary: 'bg-surface-secondary text-text-primary hover:bg-border',
  ghost: 'bg-transparent text-primary hover:bg-primary-light',
  danger: 'bg-error text-white hover:bg-error/90',
}

export function Button({
  variant = 'primary',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'touch-target inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
