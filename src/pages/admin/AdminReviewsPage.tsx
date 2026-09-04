import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { StarRating } from '../../components/ui/StarRating'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { adminReviewAction, listAdminReviews } from '../../services/api/admin'

export function AdminReviewsPage() {
  const queryClient = useQueryClient()

  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => listAdminReviews(),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'hide' | 'restore' | 'remove' }) =>
      adminReviewAction(id, action),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })

  if (reviewsQuery.isLoading) return <Spinner />

  const items = reviewsQuery.data ?? []

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">Review moderation</h2>
        <p className="text-sm text-text-muted">Hide, restore, or remove reviews.</p>
      </div>

      {reviewsQuery.isError && (
        <p className="text-sm text-error">
          {reviewsQuery.error instanceof Error
            ? reviewsQuery.error.message
            : 'Failed to load reviews'}
        </p>
      )}

      {items.length === 0 && !reviewsQuery.isError && (
        <EmptyState title="No reviews" description="Moderation queue is empty." />
      )}

      <ul className="space-y-3">
        {items.map((r) => {
          const id = String(r.id ?? '')
          const status = String(r.status ?? '')
          const businessName = String(r.businessName ?? r.business_name ?? 'Garage')
          const rating = Number(r.overallRating ?? r.overall_rating ?? 0)
          const comment = String(r.comment ?? '')
          const context =
            String(r.contextLabel ?? r.context_label ?? r.serviceLabel ?? r.vehicleLabel ?? '') ||
            ''
          return (
            <li key={id} className="rounded-xl border border-border bg-surface p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{businessName}</p>
                  <StarRating rating={rating} className="mt-1" />
                  {context && <p className="mt-1 text-xs text-text-muted">{context}</p>}
                </div>
                <StatusBadge status={status} />
              </div>
              {comment && <p className="mt-2 text-text-secondary line-clamp-3">{comment}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {status !== 'hidden' && (
                  <Button
                    variant="secondary"
                    loading={actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ id, action: 'hide' })}
                  >
                    Hide
                  </Button>
                )}
                {status === 'hidden' && (
                  <Button
                    variant="secondary"
                    loading={actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ id, action: 'restore' })}
                  >
                    Restore
                  </Button>
                )}
                <Button
                  variant="danger"
                  loading={actionMutation.isPending}
                  onClick={() => actionMutation.mutate({ id, action: 'remove' })}
                >
                  Remove
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
