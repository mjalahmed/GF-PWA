import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { useLocale } from '../i18n/LocaleProvider'
import {
  LEGAL_DOCUMENTS,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_EFFECTIVE_DATE_AR,
  LEGAL_VERSION,
} from '../legal'

export function LegalIndexPage() {
  const { t, locale } = useLocale()
  const effectiveDate = locale === 'ar' ? LEGAL_EFFECTIVE_DATE_AR : LEGAL_EFFECTIVE_DATE

  return (
    <div>
      <PageHeader title={t('legal.center')} backTo="/profile" />
      <div className="mx-auto max-w-lg px-4 py-6">
        <p className="text-sm text-text-muted">{t('legal.centerIntro')}</p>
        <p className="mt-2 text-xs text-text-subtle">
          {t('legal.versionMeta', { version: LEGAL_VERSION, date: effectiveDate })}
        </p>
        <ul className="mt-6 space-y-2">
          {LEGAL_DOCUMENTS.map((doc) => (
            <li key={doc.id}>
              <Link
                to={`/legal/${doc.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-primary"
              >
                <span>{t(`legal.doc.${doc.id}`)}</span>
                <span className="text-xs text-text-subtle">v{doc.version}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
