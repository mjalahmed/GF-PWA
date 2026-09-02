import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet } from 'react-router-dom'
import { listMyBusinessMemberships } from '../../services/api/business'
import { Spinner } from '../ui/Spinner'

/** Nested business routes that need an approved membership (dashboard / ops). */
export function BusinessMembershipOutlet() {
  const query = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })

  if (query.isLoading) return <Spinner />
  if (query.isError || !(query.data?.length)) {
    return <Navigate to="/business/applications" replace />
  }

  return <Outlet />
}
