import { useState, type InputHTMLAttributes } from 'react'
import { useLocale } from '../../i18n/LocaleProvider'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

function EyeIcon({ crossed }: { crossed?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden
    >
      {crossed ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 3.1 11 7a11.4 11.4 0 0 1-4.2 5.1" />
          <path d="M6.1 6.1A11.4 11.4 0 0 0 1 12c1.7 3.9 6 7 11 7a10.5 10.5 0 0 0 4.4-1" />
        </>
      ) : (
        <>
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

export function Input({ label, error, className, id, type, ...props }: InputProps) {
  const { t } = useLocale()
  const [visible, setVisible] = useState(false)
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const isPassword = type === 'password'
  const inputType = isPassword ? (visible ? 'text' : 'password') : type

  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={cn(
            'w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            isPassword && 'pe-12',
            error && 'border-error focus:border-error focus:ring-error/20',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-text-muted hover:bg-surface-secondary hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
            aria-pressed={visible}
            tabIndex={-1}
          >
            <EyeIcon crossed={visible} />
          </button>
        )}
      </div>
      {error && <span className="text-sm text-error">{error}</span>}
    </label>
  )
}
