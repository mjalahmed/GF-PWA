import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { listBusinessAuditLogs, listMyBusinessMemberships } from '../../services/api/business'

function formatChange(value: unknown): string {
  if (value == null) return '—'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function BusinessAuditPage() {
  const { businessId = '' } = useParams()
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const membershipQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })
  const membership = membershipQuery.data?.find((item) => item.businessId === businessId)
  const isOwner = membership?.role === 'owner'

  const auditQuery = useQuery({
    queryKey: ['business-audit', businessId, action, entityType, actorUserId, from, to, page],
    queryFn: () =>
      listBusinessAuditLogs(businessId, {
        action: action.trim() || undefined,
        entityType: entityType.trim() || undefined,
        actorUserId: actorUserId.trim() || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        page,
        pageSize: 20,
      }),
    enabled: Boolean(businessId) && isOwner,
  })

  if (membershipQuery.isLoading) return <Spinner />

  if (!membership) {
    return (
      <section className="space-y-3 px-4 py-4">
        <h2>Activity log</h2>
        <p>You do not have access to this garage.</p>
        <Link to="/business">Back to dashboard</Link>
      </section>
    )
  }

  if (!isOwner) {
    return (
      <section className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <Link to={`/business/garages/${businessId}`} className="text-sm text-primary">
          ← {membership.business.displayName}
        </Link>
        <h2 className="text-xl font-semibold">Activity log</h2>
        <p className="text-sm text-text-muted">
          Only the business owner can read this garage&apos;s activity log. Your role: {membership.role}.
        </p>
      </section>
    )
  }

  const items = auditQuery.data?.items ?? []
  const total = auditQuery.data?.total ?? 0
  const pageSize = auditQuery.data?.pageSize ?? 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <Link to={`/business/garages/${businessId}`} className="text-sm text-primary">
          ← {membership.business.displayName}
        </Link>
        <h2 className="mt-2 text-xl font-semibold">Activity log</h2>
        <p className="text-sm text-text-muted">
          Who changed this garage, what they changed, and when.
        </p>
      </div>

      <form
        className="grid gap-2 rounded-xl border border-border bg-surface p-3 text-sm"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
        }}
      >
        <label className="block">
          <span className="text-text-muted">Action</span>
          <input
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="business.temporarily_closed"
          />
        </label>
        <label className="block">
          <span className="text-text-muted">Resource type</span>
          <input
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="appointment"
          />
        </label>
        <label className="block">
          <span className="text-text-muted">Actor user id</span>
          <input
            className="mt-1 w-full rounded-lg border border-border px-3 py-2"
            value={actorUserId}
            onChange={(event) => setActorUserId(event.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-text-muted">From</span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-text-muted">To</span>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="rounded-lg bg-primary px-3 py-2 font-medium text-white">
          Apply filters
        </button>
      </form>

      {auditQuery.isLoading && <Spinner />}
      {auditQuery.isError && (
        <p className="text-sm text-error">
          {auditQuery.error instanceof Error ? auditQuery.error.message : 'Could not load the activity log.'}
        </p>
      )}

      {!auditQuery.isLoading && items.length === 0 && (
        <p className="text-sm text-text-muted">No activity matches these filters.</p>
      )}

      <ul className="space-y-3">
        {items.map((entry) => (
          <li key={entry.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
            <p className="font-medium">{entry.action}</p>
            <p className="text-text-muted">
              {new Date(entry.createdAt).toLocaleString()}
            </p>
            <p>
              {entry.actorName || 'Unknown person'}
              {entry.actorRole ? ` · ${entry.actorRole}` : ''}
            </p>
            <p className="text-text-muted">
              {entry.entityType}
              {entry.entityId ? ` · ${entry.entityId}` : ''}
              {entry.branchId ? ` · branch ${entry.branchId}` : ''}
            </p>
            {(entry.previousStatus || entry.newStatus) && (
              <p>
                Status {entry.previousStatus ?? '—'} → {entry.newStatus ?? '—'}
              </p>
            )}
            <details className="mt-2">
              <summary className="cursor-pointer text-primary">What changed</summary>
              <div className="mt-2 grid gap-2">
                <div>
                  <p className="text-xs uppercase text-text-muted">Previous</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{formatChange(entry.oldValues)}</pre>
                </div>
                <div>
                  <p className="text-xs uppercase text-text-muted">New</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-xs">{formatChange(entry.newValues)}</pre>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  )
}
