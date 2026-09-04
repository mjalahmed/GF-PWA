import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fetchGarageSetupChecklist } from '../../lib/fetchGarageSetup'

/** Soft gate: always render portal children; show a non-blocking banner when setup is incomplete. */
export function RequireGarageSetup({
  businessId,
  children,
}: {
  businessId: string
  children: ReactNode
}) {
  const query = useQuery({
    queryKey: ['garage-setup', businessId],
    queryFn: () => fetchGarageSetupChecklist(businessId),
    enabled: Boolean(businessId),
  })

  const showBanner = Boolean(businessId && query.data && !query.data.complete)

  return (
    <>
      {showBanner && (
        <div className="mx-auto max-w-lg px-4 pt-4">
          <div
            role="status"
            className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-text-primary"
          >
            Profile setup incomplete — add hours and services when ready.{' '}
            <Link
              to={`/business/garages/${businessId}/setup`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Continue setup
            </Link>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
