import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { useLocale } from '../i18n/LocaleProvider'
import { createReview, getReviewEligibility } from '../services/api/reviews'
import type { ReviewRatingDimensions } from '../types/reviews'

const DIMENSIONS: { key: keyof ReviewRatingDimensions; labelKey: string }[] = [
  { key: 'workQuality', labelKey: 'reviews.workQuality' },
  { key: 'pricingTransparency', labelKey: 'reviews.pricingTransparency' },
  { key: 'timeliness', labelKey: 'reviews.timeliness' },
  { key: 'customerService', labelKey: 'reviews.customerService' },
  { key: 'overallExperience', labelKey: 'reviews.overallExperience' },
]

function RatingInput({
  label,
  value,
  onChange,
  starsAria,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  starsAria: (n: number) => string
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
            aria-label={starsAria(n)}
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
  const { t } = useLocale()
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
    onError: (err) => setError(err instanceof Error ? err.message : t('reviews.submitError')),
  })

  if (eligibilityQuery.isLoading) return <Spinner />
  if (eligibilityQuery.error || !eligibilityQuery.data) {
    return (
      <div>
        <PageHeader title={t('reviews.formTitle')} backTo="/reviews" />
        <EmptyState
          title={t('reviews.notAvailable')}
          actionLabel={t('common.back')}
          onAction={() => navigate('/reviews')}
        />
      </div>
    )
  }

  const el = eligibilityQuery.data
  if (el.isUsed) {
    return (
      <div>
        <PageHeader title={t('reviews.formTitle')} backTo="/reviews" />
        <EmptyState title={t('reviews.already')} description={t('reviews.alreadyDesc')} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('reviews.formTitle')} backTo="/reviews" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <p className="mb-4 text-sm text-text-muted">
          {t('reviews.reviewing', { name: el.businessName ?? t('common.garage') })}
          {el.contextLabel && ` · ${el.contextLabel}`}
        </p>

        <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
          <RatingInput
            label={t('reviews.overall')}
            value={overallRating}
            onChange={setOverallRating}
            starsAria={(n) => t('common.starsAria', { rating: n })}
          />
          {DIMENSIONS.map(({ key, labelKey }) => (
            <RatingInput
              key={key}
              label={t(labelKey)}
              value={ratings[key]}
              onChange={(v) => setRatings((prev) => ({ ...prev, [key]: v }))}
              starsAria={(n) => t('common.starsAria', { rating: n })}
            />
          ))}
        </div>

        <label className="mt-4 block space-y-1.5">
          <span className="text-sm font-medium text-text-secondary">{t('reviews.comment')}</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            placeholder={t('reviews.commentPlaceholder')}
          />
        </label>

        {error && <p className="mt-2 text-sm text-error">{error}</p>}

        <Button
          className="mt-6 w-full"
          loading={submitMutation.isPending}
          onClick={() => submitMutation.mutate()}
        >
          {t('reviews.submit')}
        </Button>
      </div>
    </div>
  )
}
