import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { useLocale } from '../i18n/LocaleProvider'
import { isDevelopment } from '../lib/env'
import { signInWithGoogle } from '../services/api/auth'

export function SignInPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { t } = useLocale()

  const from =
    searchParams.get('next') ??
    (location.state as { from?: string } | null)?.from ??
    '/profile'

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.googleSignInFailed'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title={t('auth.signIn')} backTo="/" />
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="mb-6 text-center text-sm text-text-muted">{t('auth.googleOnlyHint')}</p>

        <Button type="button" className="w-full" loading={loading} onClick={handleGoogleSignIn}>
          {t('auth.continueWithGoogle')}
        </Button>

        {error && <p className="mt-4 text-center text-sm text-error">{error}</p>}

        {isDevelopment && (
          <p className="mt-6 rounded-xl border border-primary/30 bg-primary-light p-3 text-xs text-text-muted">
            {t('auth.verifyDevHint')}
          </p>
        )}

        <p className="mt-8 text-center">
          <Link to="/" className="text-sm text-text-subtle">
            {t('auth.continueGuest')}
          </Link>
        </p>
      </div>
    </div>
  )
}
