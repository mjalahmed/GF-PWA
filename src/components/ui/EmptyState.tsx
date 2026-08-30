import type { ReactNode } from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-4 text-4xl text-text-subtle">{icon}</div>}
      <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-text-muted">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
