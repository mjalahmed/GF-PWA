import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { signOut, updateProfile } from '../services/api/auth'

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary"
    >
      {label}
      <span className="text-text-subtle">→</span>
    </Link>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { session, profile, roles, loading, refresh } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saveError, setSaveError] = useState('')

  const saveMutation = useMutation({
    mutationFn: () => updateProfile({ fullName: fullName.trim() || undefined, phone: phone.trim() || undefined }),
    onSuccess: async () => {
      await refresh()
      setEditing(false)
    },
    onError: (err: Error) => setSaveError(err.message || 'Could not save profile'),
  })

  if (loading) {
    return (
      <div>
        <PageHeader title="Profile" />
        <Spinner />
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

  const startEdit = () => {
    setFullName(profile?.fullName ?? '')
    setPhone(profile?.phone ?? '')
    setSaveError('')
    setEditing(true)
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        action={
          !editing ? (
            <button type="button" onClick={startEdit} className="text-sm font-medium text-primary">
              Edit
            </button>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-lg px-4 py-6">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary-light text-xl font-bold text-primary">
            {(profile?.fullName ?? session.user.email ?? '?').charAt(0).toUpperCase()}
          </div>

          {editing ? (
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                saveMutation.mutate()
              }}
            >
              <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {saveError && <p className="text-sm text-error">{saveError}</p>}
              <div className="flex gap-2">
                <Button type="submit" loading={saveMutation.isPending}>
                  Save
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="mt-4 text-lg font-semibold text-text-primary">
                {profile?.fullName ?? 'GarageFinder user'}
              </h2>
              <p className="text-sm text-text-muted">{session.user.email}</p>
              {profile?.phone && <p className="mt-1 text-sm text-text-muted">{profile.phone}</p>}
            </>
          )}

          {roles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
        </section>

        <nav className="mt-6 space-y-2">
          <NavLink to="/vehicles" label="My vehicles" />
          <NavLink to="/favorites" label="Favorites" />
          <NavLink to="/appointments" label="Appointments" />
          <NavLink to="/invoices" label="Invoices" />
          <NavLink to="/quotations" label="Quotations" />
          <NavLink to="/reviews" label="Reviews" />
          <NavLink to="/disputes" label="Disputes" />
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
