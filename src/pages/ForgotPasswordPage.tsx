import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { useLocale } from '../i18n/LocaleProvider'

export function ForgotPasswordPage() {
  const { t } = useLocale()

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader title={t('auth.forgotTitle')} backTo="/sign-in" />
      <div className="mx-auto max-w-lg space-y-6 px-4 py-8 text-center">
        <p className="text-sm text-text-muted">{t('auth.forgotUseGoogle')}</p>
        <Link to="/sign-in">
          <Button className="w-full">{t('auth.continueWithGoogle')}</Button>
        </Link>
      </div>
    </div>
  )
}
