import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { verifyOtp } from '../services/api/auth'
import { useAuth } from '../hooks/useAuth'

export function VerifyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useAuth()

  const emailParam = searchParams.get('email') ?? ''
  const typeParam = (searchParams.get('type') ?? 'signup') as 'signup' | 'recovery' | 'email'

  const [email, setEmail] = useState(emailParam)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const title =
    typeParam === 'recovery' ? 'Reset password' : typeParam === 'email' ? 'Verify email' : 'Verify account'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyOtp(email, token, typeParam)
      await refresh()
      navigate(typeParam === 'recovery' ? '/profile' : '/profile', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title={title} backTo="/sign-in" />
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="mb-6 text-sm text-text-muted">
          Enter the verification code sent to your email.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="Verification code"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="6-digit code"
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Verify
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-text-muted">
          <Link to="/sign-in" className="font-medium text-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
