import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { useLocale } from '../i18n/LocaleProvider'
import { getLegalDocument, LEGAL_OPERATOR } from '../legal'

export function LegalDocumentPage() {
  const { docId = '' } = useParams()
  const { t, locale } = useLocale()
  const doc = getLegalDocument(docId, locale)

  if (!doc) {
    return (
      <div>
        <PageHeader title={t('legal.center')} backTo="/legal" />
        <EmptyState
          title={t('legal.notFound')}
          actionLabel={t('legal.backToCenter')}
          onAction={() => {
            window.location.href = '/legal'
          }}
        />
      </div>
    )
  }

  const address = locale === 'ar' ? LEGAL_OPERATOR.addressAr : LEGAL_OPERATOR.addressEn

  return (
    <div>
      <PageHeader title={t(`legal.doc.${doc.id}`)} backTo="/legal" />
      <article className="mx-auto max-w-lg px-4 py-6">
        <header className="border-b border-border pb-4">
          {doc.subtitle && (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{doc.subtitle}</p>
          )}
          <h1 className="mt-1 text-xl font-semibold text-text-primary">{doc.title}</h1>
          <p className="mt-2 text-xs text-text-muted">
            {t('legal.documentMeta', {
              version: doc.version,
              effective: doc.effectiveDate,
              updated: doc.lastUpdated,
            })}
          </p>
          <p className="mt-1 text-xs text-text-subtle">
            {LEGAL_OPERATOR.fullName} · {LEGAL_OPERATOR.businessEmail}
          </p>
          <p className="mt-0.5 text-xs text-text-subtle">{address}</p>
        </header>

        <div className="mt-6 space-y-8">
          {doc.sections.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-base font-semibold text-text-primary">{section.title}</h2>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-text-secondary">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-3 list-disc space-y-1 ps-5 text-sm text-text-secondary">
                  {section.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="mt-10 text-center text-sm">
          <Link to="/legal" className="font-medium text-primary">
            {t('legal.backToCenter')}
          </Link>
        </p>
      </article>
    </div>
  )
}
