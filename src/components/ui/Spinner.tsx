import { cn } from '../../lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
