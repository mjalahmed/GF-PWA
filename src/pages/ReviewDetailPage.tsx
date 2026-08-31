import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StarRating } from '../components/ui/StarRating'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDateLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { getReview } from '../services/api/reviews'

const RATING_LABEL_KEYS: Record<string, string> = {
  workQuality: 'reviews.workQuality',
  pricingTransparency: 'reviews.pricingTransparency',
  timeliness: 'reviews.timeliness',
  customerService: 'reviews.customerService',
  overallExperience: 'reviews.overallExperience',
}

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, dateLocale } = useLocale()

  const { data: review, isLoading, error } = useQuery({
    queryKey: ['review', id],
    queryFn: () => getReview(id!),
    enabled: !!id,
  })

  if (isLoading) return <Spinner />
  if (error || !review) {
    return (
      <div>
        <PageHeader title={t('reviews.detail')} backTo="/reviews" />
        <EmptyState
          title={t('reviews.notFound')}
          actionLabel={t('common.back')}
          onAction={() => navigate('/reviews')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('reviews.detail')} backTo="/reviews" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {review.businessName ?? t('common.garage')}
            </h2>
            <StarRating rating={review.overallRating} className="mt-1" />
            <p className="mt-1 text-sm text-text-muted">
              {formatDateLocalized(review.createdAt, dateLocale)}
            </p>
          </div>
          <StatusBadge status={review.status} />
        </div>

        {review.comment && (
          <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
            {review.comment}
          </p>
        )}

        <section className="mt-4">
          <h3 className="mb-2 font-semibold text-text-primary">{t('common.ratings')}</h3>
          <dl className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
            {Object.entries(review.ratings).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-text-muted">{t(RATING_LABEL_KEYS[key] ?? key)}</dt>
                <dd>{t('common.ratingOutOf', { value })}</dd>
              </div>
            ))}
          </dl>
        </section>

        {review.response && (
          <section className="mt-4 rounded-xl bg-surface-secondary p-4">
            <h3 className="font-semibold text-text-primary">{t('common.garageResponse')}</h3>
            <p className="mt-2 text-sm text-text-secondary">{review.response.message}</p>
            <p className="mt-1 text-xs text-text-muted">
              {formatDateLocalized(review.response.respondedAt, dateLocale)}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
