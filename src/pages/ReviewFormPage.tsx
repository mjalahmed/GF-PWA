import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { createReview, getReviewEligibility } from '../services/api/reviews'
import type { ReviewRatingDimensions } from '../types/reviews'

const DIMENSIONS: { key: keyof ReviewRatingDimensions; label: string }[] = [
  { key: 'workQuality', label: 'Work quality' },
  { key: 'pricingTransparency', label: 'Pricing transparency' },
  { key: 'timeliness', label: 'Timeliness' },
  { key: 'customerService', label: 'Customer service' },
  { key: 'overallExperience', label: 'Overall experience' },
]

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`text-lg ${n <= value ? 'text-rating' : 'text-text-subtle opacity-40'}`}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReviewFormPage() {
  const { eligibilityId } = useParams<{ eligibilityId: string }>()
  const navigate = useNavigate()
  const [overallRating, setOverallRating] = useState(5)
  const [ratings, setRatings] = useState<ReviewRatingDimensions>({
    workQuality: 5,
    pricingTransparency: 5,
    timeliness: 5,
    customerService: 5,
    overallExperience: 5,
  })
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const eligibilityQuery = useQuery({
    queryKey: ['review-eligibility', eligibilityId],
    queryFn: () => getReviewEligibility(eligibilityId!),
    enabled: !!eligibilityId,
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      createReview({
        eligibilityId: eligibilityId!,
        overallRating,
        ratings,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (review) => navigate(`/reviews/${review.id}`, { replace: true }),
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not submit review'),
  })

  if (eligibilityQuery.isLoading) return <Spinner />
  if (eligibilityQuery.error || !eligibilityQuery.data) {
    return (
      <div>
        <PageHeader title="Write review" backTo="/reviews" />
        <EmptyState title="Review not available" actionLabel="Back" onAction={() => navigate('/reviews')} />
      </div>
    )
  }

  const el = eligibilityQuery.data
  if (el.isUsed) {
    return (
      <div>
        <PageHeader title="Write review" backTo="/reviews" />
        <EmptyState title="Already reviewed" description="This visit has already been reviewed." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Write review" backTo="/reviews" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <p className="mb-4 text-sm text-text-muted">
          Reviewing {el.businessName ?? 'garage'}
          {el.contextLabel && ` · ${el.contextLabel}`}
        </p>

        <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
          <RatingInput label="Overall rating" value={overallRating} onChange={setOverallRating} />
          {DIMENSIONS.map(({ key, label }) => (
            <RatingInput
              key={key}
              label={label}
              value={ratings[key]}
              onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
            />
          ))}
        </div>

        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-text-secondary">Comment (optional)</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            placeholder="Share your experience…"
          />
        </label>

        {error && <p className="mt-2 text-sm text-error">{error}</p>}

        <Button
          className="mt-6 w-full"
          loading={submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
        >
          Submit review
        </Button>
      </div>
    </div>
  )
}
