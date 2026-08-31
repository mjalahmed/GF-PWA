import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { IconChevron } from '../components/icons/NavIcons'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { LanguageToggle } from '../i18n/LanguageToggle'
import { useLocale } from '../i18n/LocaleProvider'
import { signOut, updateProfile } from '../services/api/auth'
import type { MessageKey } from '../i18n/messages'

function ProfileNavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary"
    >
      {label}
      <IconChevron className="size-4 text-text-subtle rtl:rotate-180" />
    </Link>
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { session, profile, roles, loading, refresh } = useAuth()
  const { t } = useLocale()
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
    onError: (err: Error) => setSaveError(err.message || t('profile.saveError')),
  })

  if (loading) {
    return (
      <div>
        <PageHeader title={t('profile.title')} />
        <Spinner />
      </div>
    )
  }

  const languageSection = (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">{t('lang.label')}</h2>
          <p className="mt-0.5 text-xs text-text-muted">A / ع</p>
        </div>
        <LanguageToggle />
      </div>
    </section>
  )

  if (!session) {
    return (
      <div>
        <PageHeader title={t('profile.title')} />
        <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
          {languageSection}
          <div className="text-center">
            <p className="text-text-muted">{t('profile.signInPrompt')}</p>
            <Button className="mt-6" onClick={() => navigate('/sign-in')}>
              {t('profile.signIn')}
            </Button>
          </div>
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

  const links: { to: string; labelKey: MessageKey }[] = [
    { to: '/vehicles', labelKey: 'profile.vehicles' },
    { to: '/favorites', labelKey: 'profile.favorites' },
    { to: '/appointments', labelKey: 'profile.appointments' },
    { to: '/invoices', labelKey: 'profile.invoices' },
    { to: '/quotations', labelKey: 'profile.quotations' },
    { to: '/reviews', labelKey: 'profile.reviews' },
    { to: '/disputes', labelKey: 'profile.disputes' },
  ]

  return (
    <div>
      <PageHeader
        title={t('profile.title')}
        action={
          !editing ? (
            <button type="button" onClick={startEdit} className="text-sm font-medium text-primary">
              {t('profile.edit')}
            </button>
          ) : undefined
        }
      />
      <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
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
              <Input label={t('profile.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label={t('profile.phone')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              {saveError && <p className="text-sm text-error">{saveError}</p>}
              <div className="flex gap-2">
                <Button type="submit" loading={saveMutation.isPending}>
                  {t('profile.save')}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  {t('profile.cancel')}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="mt-4 text-lg font-semibold text-text-primary">
                {profile?.fullName ?? t('profile.defaultName')}
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

        {languageSection}

        <nav className="space-y-2">
          {links.map((link) => (
            <ProfileNavLink key={link.to} to={link.to} label={t(link.labelKey)} />
          ))}
        </nav>

        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await signOut()
            window.location.href = '/'
          }}
        >
          {t('profile.signOut')}
        </Button>
      </div>
    </div>
  )
}
