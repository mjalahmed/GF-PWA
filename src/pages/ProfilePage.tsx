import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../services/api/auth'

export function ProfilePage() {
  const navigate = useNavigate()
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div>
        <PageHeader title="Profile" />
        <div className="flex justify-center py-12">
          <span className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div>
        <PageHeader title="Profile" />
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <p className="text-text-muted">Sign in to manage your profile and vehicles.</p>
          <Button className="mt-6" onClick={() => navigate('/sign-in')}>
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="mx-auto max-w-lg px-4 py-6">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary-light text-xl font-bold text-primary">
            {(profile?.fullName ?? session.user.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-4 text-lg font-semibold text-text-primary">
            {profile?.fullName ?? 'GarageFinder user'}
          </h2>
          <p className="text-sm text-text-muted">{session.user.email}</p>
          {profile?.phone && <p className="mt-1 text-sm text-text-muted">{profile.phone}</p>}
        </section>

        <nav className="mt-6 space-y-2">
          <Link
            to="/vehicles"
            className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary"
          >
            My vehicles
            <span className="text-text-subtle">→</span>
          </Link>
          <Link
            to="/bookings"
            className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary"
          >
            My bookings
            <span className="text-text-subtle">→</span>
          </Link>
        </nav>

        <Button
          variant="secondary"
          className="mt-8 w-full"
          onClick={async () => {
            await signOut()
            window.location.href = '/'
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
