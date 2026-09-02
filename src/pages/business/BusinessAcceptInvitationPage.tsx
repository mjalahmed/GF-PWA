import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { useAuth } from '../../hooks/useAuth'
import { useLocale } from '../../i18n/LocaleProvider'
import { PROVIDER_ACCEPTANCE } from '../../legal'
import { acceptBusinessInvitation } from '../../services/api/business'
import { recordLegalAcceptance } from '../../services/api/legal'

export function BusinessAcceptInvitationPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const { t } = useLocale()
  const [error, setError] = useState('')
  const [acceptedProvider, setAcceptedProvider] = useState(false)

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const result = await acceptBusinessInvitation(token)
      await recordLegalAcceptance({
        ...PROVIDER_ACCEPTANCE,
        businessId: result.businessId,
      })
      return result
    },
    onSuccess: (result) => {
      navigate(`/business/garages/${result.businessId}`, { replace: true })
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Could not accept invitation')
    },
  })

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

  if (acceptMutation.isSuccess) return <Spinner />

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-8">
      <h2 className="text-lg font-semibold text-text-primary">Accept team invitation</h2>
      <p className="text-sm text-text-muted">
        Before joining this Automotive Service Provider on GarageFinder, please review and accept
        the Provider Agreement.
      </p>
      <label className="flex items-start gap-3 text-sm text-text-secondary">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-border"
          checked={acceptedProvider}
          onChange={(e) => setAcceptedProvider(e.target.checked)}
        />
        <span>
          {t('legal.providerAccept')}{' '}
          <Link to="/legal/provider" className="font-medium text-primary" target="_blank">
            {t('legal.providerAgreementLink')}
          </Link>
        </span>
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <Button
        className="w-full"
        loading={acceptMutation.isPending}
        disabled={!acceptedProvider}
        onClick={() => {
          if (!acceptedProvider) {
            setError(t('legal.providerAcceptRequired'))
            return
          }
          setError('')
          acceptMutation.mutate()
        }}
      >
        Accept invitation
      </Button>
      <Link to="/business" className="block text-center text-sm text-text-muted">
        Back to garage portal
      </Link>
    </section>
  )
}
