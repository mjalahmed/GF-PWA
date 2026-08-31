import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDate, formatStatus } from '../lib/utils'
import { getDispute, postDisputeMessage, withdrawDispute } from '../services/api/disputes'

const WITHDRAWABLE = new Set(['open', 'under_review', 'pending'])

export function DisputeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')

  const disputeQuery = useQuery({
    queryKey: ['dispute', id],
    queryFn: () => getDispute(id!),
    enabled: !!id,
  })

  const messageMutation = useMutation({
    mutationFn: (text: string) => postDisputeMessage(id!, text),
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['dispute', id] })
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawDispute(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dispute', id] }),
  })

  const d = disputeQuery.data

  if (disputeQuery.isLoading) return <Spinner />
  if (disputeQuery.error || !d) {
    return (
      <div>
        <PageHeader title="Dispute" backTo="/disputes" />
        <EmptyState title="Dispute not found" actionLabel="Back" onAction={() => navigate('/disputes')} />
      </div>
    )
  }

  const canWithdraw = WITHDRAWABLE.has(d.status)

  return (
    <div>
      <PageHeader title={d.disputeNumber} backTo="/disputes" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {d.businessName && <p className="text-sm text-text-muted">{d.businessName}</p>}
            <p className="text-xs text-text-subtle">{formatStatus(d.reasonCode)}</p>
          </div>
          <StatusBadge status={d.status} />
        </div>

        <section className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <h3 className="font-semibold text-text-primary">{d.summary}</h3>
          {d.description && <p className="mt-2 text-sm text-text-secondary">{d.description}</p>}
          <p className="mt-2 text-xs text-text-muted">Opened {formatDate(d.createdAt)}</p>
        </section>

        <section className="mt-6">
          <h3 className="mb-3 font-semibold text-text-primary">Messages</h3>
          {d.messages.length === 0 && (
            <p className="text-sm text-text-muted">No messages yet.</p>
          )}
          <div className="space-y-3">
            {d.messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl p-3 text-sm ${
                  msg.isFromCustomer
                    ? 'ml-4 bg-primary-light text-text-primary'
                    : 'mr-4 border border-border bg-surface'
                }`}
              >
                <p>{msg.message}</p>
                <p className="mt-1 text-xs text-text-muted">{formatDate(msg.createdAt)}</p>
              </div>
            ))}
          </div>
        </section>

        {d.status !== 'withdrawn' && d.status !== 'closed' && (
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (message.trim()) messageMutation.mutate(message.trim())
            }}
          >
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message…"
              className="flex-1"
            />
            <Button type="submit" loading={messageMutation.isPending} disabled={!message.trim()}>
              Send
            </Button>
          </form>
        )}

        {canWithdraw && (
          <Button
            variant="danger"
            className="mt-8 w-full"
            loading={withdrawMutation.isPending}
            onClick={() => withdrawMutation.mutate()}
          >
            Withdraw dispute
          </Button>
        )}
      </div>
    </div>
  )
}
