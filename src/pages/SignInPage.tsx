import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { GarageFinderLogo } from '../components/brand/GarageFinderLogo'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../i18n/LocaleProvider'
import { CUSTOMER_SIGNUP_ACCEPTANCES } from '../legal'
import { userMessageKey } from '../lib/error-codes'
import { signIn, signUp } from '../services/api/auth'
import { recordLegalAcceptances } from '../services/api/legal'

export function SignInPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refresh } = useAuth()
  const { t } = useLocale()
  const from = (location.state as { from?: string } | null)?.from ?? '/profile'

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (mode === 'sign-up' && !acceptedLegal) {
      setError(t('auth.acceptLegalRequired'))
      return
    }
    setLoading(true)
    try {
      if (mode === 'sign-in') {
        await signIn(email, password)
        await refresh()
        navigate(from, { replace: true })
      } else {
        const result = await signUp(email, password, fullName)
        await refresh()
        if (result.session) {
          await recordLegalAcceptances(CUSTOMER_SIGNUP_ACCEPTANCES)
          navigate(from, { replace: true })
        } else {
          sessionStorage.setItem('gf_pending_legal_accept', '1')
          navigate(`/auth/verify?email=${encodeURIComponent(email)}&type=signup`, { replace: true })
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t(userMessageKey('INVALID_CREDENTIALS'))
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        title={mode === 'sign-in' ? t('auth.signIn') : t('auth.createAccount')}
        backTo="/"
      />
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <GarageFinderLogo height={64} className="rounded-2xl" />
          <p className="text-sm font-semibold text-text-primary">GarageFinder</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'sign-up' && (
            <Input
              label={t('auth.fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          )}
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          />
          {mode === 'sign-in' && (
            <p className="text-right">
              <Link to="/forgot-password" className="text-sm font-medium text-primary">
                {t('auth.forgot')}
              </Link>
            </p>
          )}
          {mode === 'sign-up' && (
            <div className="space-y-2">
              <p className="text-xs text-text-muted">
                <Link to="/legal/terms" className="font-medium text-primary">
                  {t('auth.termsLink')}
                </Link>
                {' · '}
                <Link to="/legal/privacy" className="font-medium text-primary">
                  {t('auth.privacyLink')}
                </Link>
              </p>
              <label className="flex items-start gap-3 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  className="mt-1 size-4 rounded border-border"
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  required
                />
                <span>{t('auth.acceptLegal')}</span>
              </label>
            </div>
          )}
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            {mode === 'sign-in' ? t('auth.signIn') : t('auth.createAccount')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          {mode === 'sign-in' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
          <button
            type="button"
            className="font-medium text-primary"
            onClick={() => {
              setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
              setError('')
            }}
          >
            {mode === 'sign-in' ? t('auth.signUp') : t('auth.signIn')}
          </button>
        </p>

        <p className="mt-4 text-center">
          <Link to="/" className="text-sm text-text-subtle">
            {t('auth.continueGuest')}
          </Link>
        </p>
        <p className="mt-6 text-center text-xs text-text-subtle">
          <Link to="/legal" className="hover:text-primary">
            {t('legal.center')}
          </Link>
        </p>
      </div>
    </div>
  )
}
