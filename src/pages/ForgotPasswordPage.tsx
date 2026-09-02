import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useLocale } from '../i18n/LocaleProvider'
import { resetPassword } from '../services/api/auth'

export function ForgotPasswordPage() {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title={t('auth.forgotTitle')} backTo="/sign-in" />
      <div className="mx-auto max-w-lg px-4 py-8">
        {sent ? (
          <div className="text-center">
            <p className="text-text-secondary">{t('auth.resetSent', { email })}</p>
            <p className="mt-3 text-sm text-text-muted">{t('auth.resetSentHint')}</p>
            <Link to="/sign-in" className="mt-6 inline-block font-medium text-primary">
              {t('auth.backToSignIn')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-text-muted">{t('auth.forgotInstructions')}</p>
            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              {t('auth.sendReset')}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
