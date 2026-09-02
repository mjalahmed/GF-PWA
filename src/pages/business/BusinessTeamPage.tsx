import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { isDevelopment } from '../../lib/env'
import {
  createBusinessInvitation,
  listBusinessInvitations,
  listMyBusinessMemberships,
  revokeBusinessInvitation,
} from '../../services/api/business'
import { INVITABLE_ROLES, type InvitableRole } from '../../types/business'

export function BusinessTeamPage() {
  const { businessId = '' } = useParams()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitableRole>('staff')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [lastToken, setLastToken] = useState('')

  const membershipQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })

  const invitationsQuery = useQuery({
    queryKey: ['business-invitations', businessId],
    queryFn: () => listBusinessInvitations(businessId),
    enabled: Boolean(businessId),
  })

  const membership = membershipQuery.data?.find((m) => m.businessId === businessId)
  const canInvite = membership && ['owner', 'manager'].includes(membership.role)

  const inviteMutation = useMutation({
    mutationFn: () =>
      createBusinessInvitation(businessId, {
        email: email.trim().toLowerCase(),
        role,
        expiresInDays: 7,
      }),
    onSuccess: (result) => {
      setSuccess(`Invitation email sent to ${result.invitation.email}.`)
      setLastToken(result.token)
      setEmail('')
      setError('')
      queryClient.invalidateQueries({ queryKey: ['business-invitations', businessId] })
    },
    onError: (err) => {
      setSuccess('')
      setError(err instanceof Error ? err.message : 'Failed to send invitation')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => revokeBusinessInvitation(businessId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-invitations', businessId] })
    },
  })

  if (membershipQuery.isLoading || invitationsQuery.isLoading) return <Spinner />

  if (!membership) {
    return (
      <section className="space-y-3 px-4 py-4">
        <h2>Team</h2>
        <p>You do not have access to this garage.</p>
        <Link to="/business">Back to dashboard</Link>
      </section>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess('')
    setError('')
    if (!email.trim()) {
      setError('Enter an email address')
      return
    }
    inviteMutation.mutate()
  }

  return (
    <RequireGarageSetup businessId={businessId}>
    <section className="mx-auto max-w-lg space-y-6 px-4 py-4">
      <div>
        <Link to={`/business/garages/${businessId}`} className="text-sm text-primary">
          ← {membership.business.displayName}
        </Link>
        <h2 className="mt-2 text-xl font-semibold">Team invitations</h2>
        <p className="text-sm text-text-muted">
          Invites are delivered by email from GarageFinder. Use a real inbox you can open to
          verify SMTP.
        </p>
      </div>

      {!canInvite ? (
        <p className="rounded-xl border border-border bg-surface-secondary p-4 text-sm">
          Only owners and managers can invite team members. Your role: {membership.role}.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            required
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-secondary">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as InvitableRole)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-error">{error}</p>}
          {success && <p className="text-sm text-success">{success}</p>}
          {isDevelopment && lastToken && (
            <p className="rounded-lg bg-surface-secondary p-3 text-xs break-all text-text-muted">
              Dev accept link:{' '}
              <Link to={`/business/invitations/accept?token=${encodeURIComponent(lastToken)}`}>
                /business/invitations/accept?token=…
              </Link>
            </p>
          )}
          <Button type="submit" loading={inviteMutation.isPending} className="w-full">
            Send invitation email
          </Button>
        </form>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">Pending invitations</h3>
        {(invitationsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-text-muted">No invitations yet.</p>
        ) : (
          <ul className="space-y-2">
            {(invitationsQuery.data ?? []).map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-3"
              >
                <div>
                  <p className="font-medium">{invitation.email}</p>
                  <p className="text-sm text-text-muted">
                    {invitation.role} · {invitation.status}
                  </p>
                </div>
                {invitation.status === 'pending' && canInvite && (
                  <Button
                    variant="ghost"
                    loading={revokeMutation.isPending}
                    onClick={() => revokeMutation.mutate(invitation.id)}
                  >
                    Revoke
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
    </RequireGarageSetup>
  )
}
