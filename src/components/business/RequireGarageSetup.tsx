import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { fetchGarageSetupChecklist } from '../../lib/fetchGarageSetup'
import { Spinner } from '../ui/Spinner'

/** Redirects business operators to Setup until the go-live checklist is complete. */
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

  if (!businessId) return children
  if (query.isLoading) return <Spinner />
  if (query.data && !query.data.complete) {
    return <Navigate to={`/business/garages/${businessId}/setup`} replace />
  }

  return children
}
