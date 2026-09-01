import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../i18n/LocaleProvider'
import { userMessageKey } from '../lib/error-codes'
import { signIn, signUp } from '../services/api/auth'

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
          navigate(from, { replace: true })
        } else {
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
      </div>
    </div>
  )
}
