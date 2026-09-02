import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../ui/Spinner'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />

  return children
}

export function RoleProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode
  roles: string[]
}) {
  const { session, roles: userRoles, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
  if (!userRoles.some((r) => roles.includes(r))) {
    return <Navigate to="/profile" replace />
  }

  return children
}
