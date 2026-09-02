import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../i18n/LocaleProvider'
import { supabase } from '../lib/supabase'
import { updatePassword } from '../services/api/auth'

function urlLooksLikeRecovery(): boolean {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  return (
    hash.get('type') === 'recovery' ||
    query.get('type') === 'recovery' ||
    hash.has('access_token') ||
    query.has('code')
  )
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const { t } = useLocale()

  const [checking, setChecking] = useState(true)
  const [canReset, setCanReset] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    const fromLink = urlLooksLikeRecovery()

    const markReady = (ok: boolean) => {
      if (!active) return
      setCanReset(ok)
      setChecking(false)
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY') {
        markReady(true)
        return
      }
      if (fromLink && session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        markReady(true)
      }
    })

    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (!active) return
      if (fromLink && data.session) {
        markReady(true)
        return
      }
      if (!fromLink) {
        markReady(false)
        return
      }
      // Link present; wait briefly for Supabase to exchange the token
      window.setTimeout(() => {
        if (!active) return
        void supabase.auth.getSession().then(({ data: again }) => {
          markReady(!!again.session)
        })
      }, 1500)
    })()

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      await refresh()
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetUpdateError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title={t('auth.verifyRecovery')} backTo="/sign-in" />
      <div className="mx-auto max-w-lg px-4 py-8">
        {checking && <Spinner className="py-12" />}
        {!checking && !canReset && (
          <div className="text-center">
            <p className="text-sm text-text-secondary">{t('auth.resetLinkInvalid')}</p>
            <Link to="/forgot-password" className="mt-6 inline-block font-medium text-primary">
              {t('auth.sendReset')}
            </Link>
          </div>
        )}
        {!checking && canReset && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-text-muted">{t('auth.resetChoosePassword')}</p>
            <Input
              label={t('auth.newPassword')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <Input
              label={t('auth.confirmPassword')}
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              {t('auth.savePassword')}
            </Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-text-muted">
          <Link to="/sign-in" className="font-medium text-primary">
            {t('auth.backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
