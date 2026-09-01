import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../i18n/LocaleProvider'
import { supabase } from '../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refresh } = useAuth()
  const { t } = useLocale()
  const [error, setError] = useState('')

  const next = searchParams.get('next') ?? '/profile'

  useEffect(() => {
    let active = true

    const complete = async () => {
      for (let attempt = 0; attempt < 15; attempt += 1) {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          if (active) setError(sessionError.message)
          return
        }
        if (data.session) {
          await refresh()
          if (active) navigate(next, { replace: true })
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
      if (active) setError(t('auth.googleCallbackFailed'))
    }

    complete()

    return () => {
      active = false
    }
  }, [navigate, next, refresh, t])

  if (error) {
    return (
      <div className="min-h-dvh bg-background">
        <PageHeader title={t('auth.signIn')} backTo="/sign-in" />
        <div className="mx-auto max-w-lg space-y-4 px-4 py-8 text-center">
          <p className="text-sm text-error">{error}</p>
          <Link to="/sign-in">
            <Button>{t('auth.tryAgain')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title={t('auth.signIn')} backTo="/" />
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    </div>
  )
}
