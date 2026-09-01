import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { acceptBusinessInvitation } from '../../services/api/business'

export function BusinessAcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [error, setError] = useState('')

  const acceptMutation = useMutation({
    mutationFn: () => acceptBusinessInvitation(token),
    onSuccess: (result) => {
      navigate(`/business/garages/${result.businessId}`, { replace: true })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Could not accept invitation')
    },
  })
  const attempted = useRef(false)

  useEffect(() => {
    if (!loading && session && token && !attempted.current) {
      attempted.current = true
      acceptMutation.mutate()
    }
  }, [loading, session, token, acceptMutation])

  if (!token) {
    return (
      <section className="mx-auto max-w-lg space-y-3 px-4 py-8">
        <h2>Invalid invitation link</h2>
        <p>This link is missing a token. Open the link from your invitation email.</p>
        <Link to="/business">Go to garage portal</Link>
      </section>
    )
  }

  if (loading) return <Spinner />

  if (!session) {
    return (
      <section className="mx-auto max-w-lg space-y-4 px-4 py-8">
        <h2>Accept team invitation</h2>
        <p>Sign in with the email address that received the invitation, then return here.</p>
        <Link
          to="/sign-in"
          state={{ from: `/business/invitations/accept?token=${encodeURIComponent(token)}` }}
          className="inline-flex rounded-xl bg-primary px-4 py-2.5 font-semibold text-white no-underline"
        >
          Sign in to accept
        </Link>
      </section>
    )
  }

  if (acceptMutation.isPending) return <Spinner />

  if (error) {
    return (
      <section className="mx-auto max-w-lg space-y-3 px-4 py-8">
        <h2>Could not accept invitation</h2>
        <p className="text-error">{error}</p>
        <p className="text-sm text-text-muted">
          Make sure you are signed in with the same email the invitation was sent to.
        </p>
        <Link to="/business">Back to garage portal</Link>
      </section>
    )
  }

  return <Spinner />
}
