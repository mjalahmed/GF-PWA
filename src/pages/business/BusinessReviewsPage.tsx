import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import { StarRating } from '../../components/ui/StarRating'
import { formatDateLocalized } from '../../i18n/format'
import { useLocale } from '../../i18n/LocaleProvider'
import { listGarageReviews, requestReviewDispute } from '../../services/api/business'

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'abusive', label: 'Abusive' },
  { value: 'fraudulent', label: 'Fraudulent' },
  { value: 'irrelevant', label: 'Irrelevant' },
  { value: 'conflict_of_interest', label: 'Conflict of interest' },
  { value: 'other', label: 'Other' },
] as const

export function BusinessReviewsPage() {
  const { businessId = '' } = useParams()
  const queryClient = useQueryClient()
  const { dateLocale } = useLocale()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reasonCode, setReasonCode] = useState<string>('other')
  const [details, setDetails] = useState('')

  const reviewsQuery = useQuery({
    queryKey: ['business-reviews', businessId],
    queryFn: () => listGarageReviews(businessId),
    enabled: Boolean(businessId),
  })

  const disputeMutation = useMutation({
    mutationFn: () =>
      requestReviewDispute(businessId, reportingId!, reasonCode, details.trim() || undefined),
    onSuccess: () => {
      setMessage('Dispute request submitted for review.')
      setError('')
      setReportingId(null)
      setDetails('')
      void queryClient.invalidateQueries({ queryKey: ['business-reviews', businessId] })
    },
    onError: (err: Error) => {
      setError(err.message)
      setMessage('')
    },
  })

  if (reviewsQuery.isLoading) return <Spinner />

  const reviews = reviewsQuery.data ?? []

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Link to={`/business/garages/${businessId}`} className="text-sm text-primary">
          ← Garage
        </Link>
        <h2 className="text-xl font-semibold">Garage reviews</h2>
        <p className="text-sm text-text-muted">
          Request a dispute if a review violates platform policy.
        </p>
        {error && <p className="text-sm text-error">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        {reviews.length === 0 && (
          <p className="text-sm text-text-muted">No reviews yet.</p>
        )}

        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <StarRating rating={review.overallRating} />
                <span className="text-xs text-text-muted">
                  {formatDateLocalized(review.createdAt, dateLocale)}
                </span>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-text-secondary">{review.comment}</p>
              )}
              {reportingId === review.id ? (
                <div className="mt-3 space-y-2 rounded-lg bg-surface-secondary p-3">
                  <label className="block text-sm">
                    <span className="mb-1 block text-text-muted">Reason</span>
                    <select
                      className="w-full rounded-xl border border-border bg-background px-3 py-2"
                      value={reasonCode}
                      onChange={(e) => setReasonCode(e.target.value)}
                    >
                      {REPORT_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-text-muted">Details (optional)</span>
                    <textarea
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                      rows={3}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button
                      loading={disputeMutation.isPending}
                      onClick={() => disputeMutation.mutate()}
                    >
                      Submit dispute
                    </Button>
                    <Button
                      className="bg-transparent text-text-muted"
                      onClick={() => setReportingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-primary"
                  onClick={() => {
                    setReportingId(review.id)
                    setReasonCode('other')
                    setDetails('')
                  }}
                >
                  Request dispute
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </RequireGarageSetup>
  )
}
