import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StarRating } from '../components/ui/StarRating'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useLocale } from '../i18n/LocaleProvider'
import { listReviewEligibilities, listReviews } from '../services/api/reviews'

export function ReviewsPage() {
  const { t } = useLocale()

  const eligibilitiesQuery = useQuery({
    queryKey: ['review-eligibilities'],
    queryFn: () => listReviewEligibilities({ isUsed: false }),
  })

  const reviewsQuery = useQuery({
    queryKey: ['reviews'],
    queryFn: () => listReviews(),
  })

  const isLoading = eligibilitiesQuery.isLoading || reviewsQuery.isLoading

  return (
    <div>
      <PageHeader title={t('reviews.title')} backTo="/profile" />
      <div className="mx-auto max-w-lg px-4 py-4">
        {isLoading && <Spinner />}

        {eligibilitiesQuery.data && eligibilitiesQuery.data.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 font-semibold text-text-primary">{t('reviews.ready')}</h2>
            <div className="space-y-2">
              {eligibilitiesQuery.data.map((el) => (
                <div key={el.id} className="rounded-xl border border-primary/30 bg-primary-light/30 p-4">
                  <p className="font-medium text-text-primary">
                    {el.businessName ?? t('common.garage')}
                  </p>
                  {el.contextLabel && <p className="text-sm text-text-muted">{el.contextLabel}</p>}
                  <Link to={`/reviews/new/${el.id}`} className="mt-3 block">
                    <Button className="w-full">{t('reviews.write')}</Button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-3 font-semibold text-text-primary">{t('reviews.yours')}</h2>
          {reviewsQuery.error && (
            <EmptyState
              title={t('reviews.loadError')}
              actionLabel={t('common.retry')}
              onAction={() => reviewsQuery.refetch()}
            />
          )}
          {reviewsQuery.data?.length === 0 && (
            <EmptyState
              title={t('reviews.empty')}
              description={t('reviews.emptyDesc')}
              icon="⭐"
            />
          )}
          {reviewsQuery.data && reviewsQuery.data.length > 0 && (
            <div className="space-y-3">
              {reviewsQuery.data.map((review) => (
                <Link
                  key={review.id}
                  to={`/reviews/${review.id}`}
                  className="block rounded-2xl border border-border bg-surface p-4 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text-primary">
                        {review.businessName ?? t('common.garage')}
                      </p>
                      {(review.contextLabel || review.serviceLabel || review.vehicleLabel) && (
                        <p className="mt-0.5 text-xs text-text-muted">
                          {[review.contextLabel, review.serviceLabel, review.vehicleLabel]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                      <StarRating rating={review.overallRating} className="mt-1" />
                    </div>
                    <StatusBadge status={review.status} />
                  </div>
                  {review.comment && (
                    <p className="mt-2 line-clamp-2 text-sm text-text-muted">{review.comment}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
