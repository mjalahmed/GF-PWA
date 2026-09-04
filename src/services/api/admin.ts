import type { ApplicationDetail, ApplicationDocument, BusinessApplication, BusinessSettings } from '../../types/onboarding'
import { normalizeBusinessSettings } from './business'
import { apiClient, buildQuery } from './client'
import { adminPaths } from './paths'

function asArray<T>(json: unknown): T[] {
  return Array.isArray(json) ? (json as T[]) : []
}

export async function listAdminApplications(params?: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<BusinessApplication[]> {
  const envelope = await apiClient.get(
    `${adminPaths.applications}${buildQuery({
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 50,
    })}`,
    (json) => asArray<BusinessApplication>(json),
  )
  return envelope.data ?? []
}

export async function getAdminApplication(id: string): Promise<ApplicationDetail> {
  const envelope = await apiClient.get(
    adminPaths.application(id),
    (json) => json as ApplicationDetail,
  )
  return envelope.data!
}

export async function startApplicationReview(id: string): Promise<BusinessApplication> {
  const envelope = await apiClient.post(
    adminPaths.applicationAction(id, 'start-review'),
    {},
    (json) => json as BusinessApplication,
  )
  return envelope.data!
}

export async function requestApplicationChanges(
  id: string,
  reason: string,
): Promise<BusinessApplication> {
  const envelope = await apiClient.post(
    adminPaths.applicationAction(id, 'request-changes'),
    { reason },
    (json) => json as BusinessApplication,
  )
  return envelope.data!
}

export async function approveApplication(
  id: string,
): Promise<{ businessId: string; slug?: string; idempotent: boolean }> {
  const envelope = await apiClient.post(
    adminPaths.applicationAction(id, 'approve'),
    {},
    (json) => json as { businessId: string; slug?: string; idempotent: boolean },
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function rejectApplication(id: string, reason: string): Promise<BusinessApplication> {
  const envelope = await apiClient.post(
    adminPaths.applicationAction(id, 'reject'),
    { reason },
    (json) => json as BusinessApplication,
  )
  return envelope.data!
}

export async function reviewApplicationDocument(
  applicationId: string,
  documentId: string,
  input: { status: 'approved' | 'rejected'; rejectionReason?: string | null },
): Promise<ApplicationDocument> {
  const envelope = await apiClient.post(
    adminPaths.applicationDocumentReview(applicationId, documentId),
    input as Record<string, unknown>,
    (json) => json as ApplicationDocument,
  )
  return envelope.data!
}

export async function getAdminDocumentDownloadUrl(
  applicationId: string,
  documentId: string,
): Promise<{ url: string; expiresAt?: string }> {
  const envelope = await apiClient.get(
    adminPaths.applicationDocumentDownloadUrl(applicationId, documentId),
    (json) => json as Record<string, unknown>,
  )
  const data = envelope.data!
  return {
    url: String(data.url ?? data.signedUrl ?? data.signed_url ?? ''),
    expiresAt: (data.expiresAt ?? data.expires_at) as string | undefined,
  }
}

export async function getAdminBusinessSettings(businessId: string): Promise<BusinessSettings> {
  const envelope = await apiClient.get(adminPaths.businessSettings(businessId), (json) => json)
  return normalizeBusinessSettings(envelope.data)
}

export async function updateAdminBusinessSettings(
  businessId: string,
  input: Partial<BusinessSettings>,
): Promise<BusinessSettings> {
  const body = { ...input } as Record<string, unknown>
  delete body.businessId
  delete body.metadata
  if (input.metadata !== undefined) body.metadata = input.metadata
  const envelope = await apiClient.patch(
    adminPaths.businessSettings(businessId),
    body,
    (json) => json,
  )
  return normalizeBusinessSettings(envelope.data)
}

export type AdminUserRow = {
  id: string
  email?: string
  fullName?: string
  phone?: string
  status?: string
  isSuspended?: boolean
  roles?: string[]
  createdAt?: string
}

export async function listAdminUsers(params?: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<AdminUserRow[]> {
  try {
    const envelope = await apiClient.get(
      `${adminPaths.users}${buildQuery({
        status: params?.status,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 50,
      })}`,
      (json) => asArray<Record<string, unknown>>(json),
    )
    return (envelope.data ?? []).map((raw) => ({
      id: String(raw.id),
      email: (raw.email as string | undefined) ?? undefined,
      fullName: (raw.fullName ?? raw.full_name) as string | undefined,
      phone: raw.phone as string | undefined,
      status: raw.status as string | undefined,
      isSuspended: Boolean(raw.isSuspended ?? raw.is_suspended),
      roles: Array.isArray(raw.roles) ? raw.roles.map(String) : undefined,
      createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
    }))
  } catch {
    return []
  }
}

export async function setAdminUserSuspended(
  userId: string,
  suspended: boolean,
): Promise<AdminUserRow | null> {
  const envelope = await apiClient.patch(
    adminPaths.user(userId),
    { isSuspended: suspended, status: suspended ? 'suspended' : 'active' },
    (json) => json as Record<string, unknown>,
  )
  const raw = envelope.data
  if (!raw) return null
  return {
    id: String(raw.id),
    email: raw.email as string | undefined,
    fullName: (raw.fullName ?? raw.full_name) as string | undefined,
    status: raw.status as string | undefined,
    isSuspended: Boolean(raw.isSuspended ?? raw.is_suspended ?? suspended),
  }
}

export type AdminBusinessRow = {
  id: string
  slug?: string
  displayName: string
  status?: string
  verificationStatus?: string
  phone?: string
  createdAt?: string
}

export async function listAdminBusinesses(params?: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<AdminBusinessRow[]> {
  try {
    const envelope = await apiClient.get(
      `${adminPaths.businesses}${buildQuery({
        status: params?.status,
        page: params?.page ?? 1,
        pageSize: params?.pageSize ?? 50,
      })}`,
      (json) => asArray<Record<string, unknown>>(json),
    )
    return (envelope.data ?? []).map((raw) => ({
      id: String(raw.id),
      slug: raw.slug as string | undefined,
      displayName: String(raw.displayName ?? raw.display_name ?? 'Business'),
      status: raw.status as string | undefined,
      verificationStatus: (raw.verificationStatus ?? raw.verification_status) as string | undefined,
      phone: raw.phone as string | undefined,
      createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
    }))
  } catch {
    return []
  }
}

export async function setAdminBusinessStatus(
  businessId: string,
  status: 'active' | 'suspended',
): Promise<AdminBusinessRow | null> {
  const envelope = await apiClient.patch(
    adminPaths.business(businessId),
    { status },
    (json) => json as Record<string, unknown>,
  )
  const raw = envelope.data
  if (!raw) return null
  return {
    id: String(raw.id),
    displayName: String(raw.displayName ?? raw.display_name ?? 'Business'),
    status: String(raw.status ?? status),
    verificationStatus: (raw.verificationStatus ?? raw.verification_status) as string | undefined,
  }
}

export async function listAdminDisputes(params?: {
  status?: string
}): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${adminPaths.disputes}${buildQuery({ status: params?.status })}`,
    (json) => asArray<Record<string, unknown>>(json),
  )
  return envelope.data ?? []
}

export async function listAdminReviews(params?: {
  status?: string
}): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${adminPaths.reviews}${buildQuery({ status: params?.status })}`,
    (json) => asArray<Record<string, unknown>>(json),
  )
  return envelope.data ?? []
}

export async function adminReviewAction(
  reviewId: string,
  action: 'hide' | 'restore' | 'remove',
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    adminPaths.reviewAction(reviewId, action),
    {},
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function adminDisputeAction(
  disputeId: string,
  action: string,
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    adminPaths.disputeAction(disputeId, action),
    body ?? {},
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export type AdminTransaction = {
  paymentId: string
  paymentReference?: string | null
  amount: number
  currency: string
  method: string
  status: string
  customerId?: string
  customerName?: string | null
  businessId?: string
  businessName?: string | null
  invoiceId?: string
  invoiceNumber?: string | null
  createdAt?: string
  confirmedAt?: string | null
}

export async function listAdminTransactions(params?: {
  from?: string
  to?: string
  status?: string
  method?: string
  limit?: number
}): Promise<AdminTransaction[]> {
  const envelope = await apiClient.get(
    `${adminPaths.transactions}${buildQuery({
      from: params?.from,
      to: params?.to,
      status: params?.status,
      method: params?.method,
      limit: params?.limit,
    })}`,
    (json) => asArray<Record<string, unknown>>(json),
  )
  return (envelope.data ?? []).map((raw) => ({
    paymentId: String(raw.paymentId ?? raw.payment_id ?? raw.id ?? ''),
    paymentReference: (raw.paymentReference ?? raw.payment_reference) as string | null,
    amount: Number(raw.amount ?? 0),
    currency: String(raw.currency ?? 'BHD'),
    method: String(raw.method ?? ''),
    status: String(raw.status ?? ''),
    customerId: (raw.customerId ?? raw.customer_id) as string | undefined,
    customerName: (raw.customerName ?? raw.customer_name) as string | null,
    businessId: (raw.businessId ?? raw.business_id) as string | undefined,
    businessName: (raw.businessName ?? raw.business_name) as string | null,
    invoiceId: (raw.invoiceId ?? raw.invoice_id) as string | undefined,
    invoiceNumber: (raw.invoiceNumber ?? raw.invoice_number) as string | null,
    createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
    confirmedAt: (raw.confirmedAt ?? raw.confirmed_at) as string | null,
  }))
}

export async function getAdminTransaction(paymentId: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.get(
    adminPaths.transaction(paymentId),
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}
