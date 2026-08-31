import { formatStatus } from '../../lib/utils'

const statusColors: Record<string, string> = {
  confirmed: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
  issued: 'bg-primary-light text-primary',
  viewed: 'bg-primary-light text-primary',
  accepted: 'bg-success/10 text-success',
  open: 'bg-warning/10 text-warning',
  requested: 'bg-warning/10 text-warning',
  cancelled_by_customer: 'bg-surface-secondary text-text-muted',
  rejected: 'bg-error/10 text-error',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = statusColors[status] ?? 'bg-surface-secondary text-text-secondary'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {formatStatus(status)}
    </span>
  )
}
