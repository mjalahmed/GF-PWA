import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../i18n/LocaleProvider'
import { isDevelopment } from '../lib/env'
import { resendVerificationOtp, resetPassword, verifyOtp } from '../services/api/auth'

const OTP_RESEND_COOLDOWN_SEC = 60

export function VerifyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useAuth()
  const { t } = useLocale()

  const emailParam = searchParams.get('email') ?? ''
  const typeParam = (searchParams.get('type') ?? 'signup') as 'signup' | 'recovery' | 'email'

  const [email, setEmail] = useState(emailParam)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldownSec, setResendCooldownSec] = useState(OTP_RESEND_COOLDOWN_SEC)

  useEffect(() => {
    if (resendCooldownSec <= 0) return

    const timer = window.setTimeout(() => {
      setResendCooldownSec((prev) => prev - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [resendCooldownSec])

  const resendDisabled = resending || resendCooldownSec > 0

  const title =
    typeParam === 'recovery'
      ? t('auth.verifyRecovery')
      : typeParam === 'email'
        ? t('auth.verifyEmail')
        : t('auth.verifySignup')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      await verifyOtp(email, token, typeParam)
      await refresh()
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.invalidCode'))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendDisabled) return
    if (!email.trim()) {
      setError(t('auth.emailRequired'))
      return
    }
    setError('')
    setInfo('')
    setResending(true)
    try {
      if (typeParam === 'recovery') {
        await resetPassword(email.trim())
      } else {
        await resendVerificationOtp(email.trim(), typeParam === 'email' ? 'email_change' : 'signup')
      }
      setInfo(t('auth.codeResent'))
      setResendCooldownSec(OTP_RESEND_COOLDOWN_SEC)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resendFailed'))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title={title} backTo="/sign-in" />
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="mb-4 text-sm text-text-muted">{t('auth.verifyInstructions')}</p>
        <p className="mb-6 rounded-xl border border-border bg-surface-secondary p-3 text-sm text-text-muted">
          {t('auth.verifySupabaseNote')}
        </p>
        {isDevelopment && (
          <p className="mb-6 rounded-xl border border-primary/30 bg-primary-light p-3 text-sm text-text-secondary">
            {t('auth.verifyDevHint')}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label={t('auth.code')}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder={t('auth.codePlaceholder')}
          />
          {error && <p className="text-sm text-error">{error}</p>}
          {info && <p className="text-sm text-success">{info}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            {t('auth.verify')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            loading={resending}
            disabled={resendDisabled}
            onClick={handleResend}
          >
            {resendCooldownSec > 0
              ? t('auth.resendCodeWait', { seconds: resendCooldownSec })
              : t('auth.resendCode')}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          <Link to="/sign-in" className="font-medium text-primary">
            {t('auth.backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
