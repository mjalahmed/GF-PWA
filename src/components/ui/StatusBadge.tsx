import { useLocale } from '../../i18n/LocaleProvider'

const statusColors: Record<string, string> = {
  confirmed: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
  issued: 'bg-primary-light text-primary',
  viewed: 'bg-primary-light text-primary',
  accepted: 'bg-success/10 text-success',
  open: 'bg-warning/10 text-warning',
  requested: 'bg-warning/10 text-warning',
  cancelled_by_customer: 'bg-surface-secondary text-text-muted',
  cancelled_by_business: 'bg-surface-secondary text-text-muted',
  rejected: 'bg-error/10 text-error',
  paid: 'bg-success/10 text-success',
  approved: 'bg-success/10 text-success',
  withdrawn: 'bg-surface-secondary text-text-muted',
  under_review: 'bg-warning/10 text-warning',
}

export function StatusBadge({ status }: { status: string }) {
  const { statusLabel } = useLocale()
  const cls = statusColors[status] ?? 'bg-surface-secondary text-text-secondary'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {statusLabel(status)}
    </span>
  )
}
