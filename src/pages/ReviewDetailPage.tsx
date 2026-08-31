import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { StarRating } from '../components/ui/StarRating'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatDate, formatStatus } from '../lib/utils'
import { getReview } from '../services/api/reviews'

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: review, isLoading, error } = useQuery({
    queryKey: ['review', id],
    queryFn: () => getReview(id!),
    enabled: !!id,
  })

  if (isLoading) return <Spinner />
  if (error || !review) {
    return (
      <div>
        <PageHeader title="Review" backTo="/reviews" />
        <EmptyState title="Review not found" actionLabel="Back" onAction={() => navigate('/reviews')} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Review" backTo="/reviews" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{review.businessName ?? 'Garage'}</h2>
            <StarRating rating={review.overallRating} className="mt-1" />
            <p className="mt-1 text-sm text-text-muted">{formatDate(review.createdAt)}</p>
          </div>
          <StatusBadge status={review.status} />
        </div>

        {review.comment && (
          <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
            {review.comment}
          </p>
        )}

        <section className="mt-4">
          <h3 className="mb-2 font-semibold text-text-primary">Ratings</h3>
          <dl className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
            {Object.entries(review.ratings).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-text-muted">{formatStatus(key)}</dt>
                <dd>{value}/5</dd>
              </div>
            ))}
          </dl>
        </section>

        {review.response && (
          <section className="mt-4 rounded-xl bg-surface-secondary p-4">
            <h3 className="font-semibold text-text-primary">Garage response</h3>
            <p className="mt-2 text-sm text-text-secondary">{review.response.message}</p>
            <p className="mt-1 text-xs text-text-muted">{formatDate(review.response.respondedAt)}</p>
          </section>
        )}
      </div>
    </div>
  )
}
