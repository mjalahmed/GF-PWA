import { useLocale } from '../../i18n/LocaleProvider'

const FLOW = [
  'requested',
  'confirmed',
  'customer_arrived',
  'in_progress',
  'ready_for_pickup',
  'completed',
] as const

type ServiceStatusTimelineProps = {
  status: string
  statusHistory?: Array<{ status: string; changedAt: string }>
}

export function ServiceStatusTimeline({ status, statusHistory }: ServiceStatusTimelineProps) {
  const { t, statusLabel } = useLocale()
  const terminal = new Set([
    'cancelled',
    'cancelled_by_customer',
    'cancelled_by_business',
    'rejected',
    'no_show',
    'expired',
    'disputed',
  ])
  const currentIdx = FLOW.indexOf(status as (typeof FLOW)[number])
  const waitingLike =
    status.startsWith('waiting') || status === 'quote_pending' || status === 'quote_accepted'

  if (terminal.has(status)) {
    return (
      <p className="rounded-xl border border-border bg-surface-secondary p-3 text-sm text-text-muted">
        {t('status.timelineEnded', { status: statusLabel(status) })}
      </p>
    )
  }

  if (waitingLike && currentIdx === -1) {
    return (
      <p className="rounded-xl border border-border bg-surface p-3 text-sm">
        Current: <strong>{statusLabel(status)}</strong>
      </p>
    )
  }

  return (
    <ol className="space-y-0">
      {FLOW.map((step, idx) => {
        const done = currentIdx >= idx && currentIdx !== -1
        const active = status === step
        const historyEntry = statusHistory?.find((h) => h.status === step)
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`size-3 rounded-full ${done ? 'bg-primary' : 'bg-border'} ${active ? 'ring-4 ring-primary/20' : ''}`}
              />
              {idx < FLOW.length - 1 && (
                <span className={`min-h-8 w-0.5 flex-1 ${done && idx < currentIdx ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
            <div className="pb-4">
              <p className={`text-sm font-medium ${done ? 'text-text-primary' : 'text-text-muted'}`}>
                {statusLabel(step)}
              </p>
              {historyEntry?.changedAt && (
                <p className="text-xs text-text-subtle">
                  {new Date(historyEntry.changedAt).toLocaleString()}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
