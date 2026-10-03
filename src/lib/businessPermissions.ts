import { useQuery } from '@tanstack/react-query'
import { listMyBusinessMemberships } from '../services/api/business'

const MANAGER_ROLES = new Set(['owner', 'manager'])
const CASH_ROLES = new Set(['owner', 'manager', 'cashier', 'service_advisor'])

export function useMembershipRole(businessId: string) {
  const query = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
    enabled: Boolean(businessId),
  })
  const role = query.data?.find((membership) => membership.businessId === businessId)?.role
  return { role, isLoading: query.isLoading }
}

export function canManageAppointments(role: string | undefined): boolean {
  return Boolean(role && MANAGER_ROLES.has(role))
}

export function canAppointmentAction(role: string | undefined, action: string): boolean {
  if (!role) return false
  if (action === 'confirm' || action === 'reject' || action === 'cancel') {
    return MANAGER_ROLES.has(role)
  }
  return true
}

export function canCancelInvoice(role: string | undefined): boolean {
  return Boolean(role && MANAGER_ROLES.has(role))
}

export function canRecordCash(role: string | undefined): boolean {
  return Boolean(role && CASH_ROLES.has(role))
}

export function canManageCatalog(role: string | undefined): boolean {
  return Boolean(role && MANAGER_ROLES.has(role))
}

export function canRespondToReview(role: string | undefined): boolean {
  return Boolean(role && MANAGER_ROLES.has(role))
}

export function canUpdateBusinessSettings(role: string | undefined): boolean {
  return Boolean(role && MANAGER_ROLES.has(role))
}
