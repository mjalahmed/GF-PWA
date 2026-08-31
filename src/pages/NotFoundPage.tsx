import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { useLocale } from '../i18n/LocaleProvider'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useLocale()

  return (
    <div>
      <PageHeader title={t('common.notFoundTitle')} />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-6xl">🔧</p>
        <h2 className="mt-4 text-xl font-semibold text-text-primary">{t('common.pageNotFound')}</h2>
        <p className="mt-2 text-sm text-text-muted">{t('common.pageNotFoundDesc')}</p>
        <Button className="mt-8" onClick={() => navigate('/')}>
          {t('common.goHome')}
        </Button>
        <p className="mt-4">
          <Link to="/search" className="text-sm text-primary">
            {t('common.searchGarages')}
          </Link>
        </p>
      </div>
    </div>
  )
}
