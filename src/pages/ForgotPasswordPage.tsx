import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { resetPassword } from '../services/api/auth'

export function ForgotPasswordPage() {
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
      setError(err instanceof Error ? err.message : 'Could not send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title="Forgot password" backTo="/sign-in" />
      <div className="mx-auto max-w-lg px-4 py-8">
        {sent ? (
          <div className="text-center">
            <p className="text-text-secondary">
              If an account exists for <strong>{email}</strong>, we sent a reset link and verification code.
            </p>
            <Link
              to={`/auth/verify?email=${encodeURIComponent(email)}&type=recovery`}
              className="mt-6 inline-block"
            >
              <Button>Enter verification code</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-text-muted">
              Enter your email and we&apos;ll send instructions to reset your password.
            </p>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
