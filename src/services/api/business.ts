import type {
  BusinessInvitation,
  BusinessMembership,
  BusinessTeamMember,
  InvitableRole,
} from '../../types/business'
import type {
  ApplicationDetail,
  ApplicationDocument,
  BusinessApplication,
  BusinessBranch,
  BusinessProfile,
  BusinessService,
  BusinessSettings,
  CreateApplicationInput,
  CreateServiceInput,
  DocumentRequirement,
  BusinessCategory,
  OpeningHoursDay,
  UpdateApplicationBranchInput,
  UpdateApplicationInput,
} from '../../types/onboarding'
import { apiClient, buildQuery } from './client'
import { businessPaths, platformPaths } from './paths'

function asArray<T>(json: unknown): T[] {
  return Array.isArray(json) ? (json as T[]) : []
}

export async function listMyBusinessMemberships(): Promise<BusinessMembership[]> {
  const envelope = await apiClient.get(businessPaths.memberships, (json) => asArray<BusinessMembership>(json))
  return envelope.data ?? []
}

export async function listBusinessCategories(): Promise<BusinessCategory[]> {
  const envelope = await apiClient.get(businessPaths.businessCategories, (json) =>
    asArray<BusinessCategory>(json),
  )
  return envelope.data ?? []
}

export async function listDocumentRequirements(categoryId: string): Promise<DocumentRequirement[]> {
  const envelope = await apiClient.get(
    businessPaths.businessCategoryRequirements(categoryId),
    (json) => asArray<DocumentRequirement>(json),
  )
  return envelope.data ?? []
}

export async function listBusinessApplications(params?: {
  status?: string
  page?: number
  pageSize?: number
}): Promise<BusinessApplication[]> {
  const envelope = await apiClient.get(
    `${businessPaths.applications}${buildQuery({
      status: params?.status,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 20,
    })}`,
    (json) => asArray<BusinessApplication>(json),
  )
  return envelope.data ?? []
}

export async function getBusinessApplication(id: string): Promise<ApplicationDetail> {
  const envelope = await apiClient.get(
    businessPaths.application(id),
    (json) => json as ApplicationDetail,
  )
  return envelope.data!
}

export async function createBusinessApplication(
  input: CreateApplicationInput,
): Promise<BusinessApplication> {
  const envelope = await apiClient.post(
    businessPaths.applications,
    input as unknown as Record<string, unknown>,
    (json) => json as BusinessApplication,
  )
  return envelope.data!
}

export async function updateBusinessApplication(
  id: string,
  input: UpdateApplicationInput,
): Promise<BusinessApplication> {
  const envelope = await apiClient.patch(
    businessPaths.application(id),
    input as unknown as Record<string, unknown>,
    (json) => json as BusinessApplication,
  )
  return envelope.data!
}

export async function updateApplicationBranch(
  id: string,
  input: UpdateApplicationBranchInput,
): Promise<ApplicationDetail['branch']> {
  const envelope = await apiClient.patch(
    businessPaths.applicationBranch(id),
    input as unknown as Record<string, unknown>,
    (json) => json as ApplicationDetail['branch'],
  )
  return envelope.data!
}

export async function submitBusinessApplication(id: string): Promise<BusinessApplication> {
  const envelope = await apiClient.post(
    businessPaths.applicationSubmit(id),
    {},
    (json) => json as BusinessApplication,
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function withdrawBusinessApplication(id: string): Promise<BusinessApplication> {
  const envelope = await apiClient.post(
    businessPaths.applicationWithdraw(id),
    {},
    (json) => json as BusinessApplication,
  )
  return envelope.data!
}

export async function listApplicationDocuments(id: string): Promise<ApplicationDocument[]> {
  const envelope = await apiClient.get(businessPaths.applicationDocuments(id), (json) =>
    asArray<ApplicationDocument>(json),
  )
  return envelope.data ?? []
}

export async function createApplicationDocument(
  applicationId: string,
  input: {
    documentRequirementId: string
    originalFileName: string
    mimeType: 'application/pdf' | 'image/jpeg' | 'image/png'
    fileSizeBytes: number
    documentNumber?: string | null
    expiresAt?: string | null
  },
): Promise<{ document: ApplicationDocument; storagePath: string; bucket: string }> {
  const envelope = await apiClient.post(
    businessPaths.applicationDocuments(applicationId),
    input as unknown as Record<string, unknown>,
    (json) => json as { document: ApplicationDocument; storagePath: string; bucket: string },
  )
  return envelope.data!
}

export async function deleteApplicationDocument(
  applicationId: string,
  documentId: string,
): Promise<ApplicationDocument> {
  const envelope = await apiClient.delete(
    businessPaths.applicationDocument(applicationId, documentId),
    (json) => json as ApplicationDocument,
  )
  return envelope.data!
}

export async function getBusinessDashboard(businessId: string): Promise<BusinessProfile> {
  const envelope = await apiClient.get(businessPaths.business(businessId), (json) =>
    json as BusinessProfile,
  )
  return envelope.data!
}

export async function updateBusinessProfile(
  businessId: string,
  input: Partial<{
    displayName: string
    description: string | null
    phone: string
    email: string
    website: string | null
  }>,
): Promise<BusinessProfile> {
  const envelope = await apiClient.patch(
    businessPaths.business(businessId),
    input as Record<string, unknown>,
    (json) => json as BusinessProfile,
  )
  return envelope.data!
}

export async function getBusinessSettings(businessId: string): Promise<BusinessSettings> {
  const envelope = await apiClient.get(businessPaths.settings(businessId), (json) =>
    json as BusinessSettings & { metadata?: Record<string, unknown> },
  )
  const data = envelope.data!
  const meta = data.metadata ?? {}
  return {
    ...data,
    publiclyVisible:
      typeof meta.publiclyVisible === 'boolean'
        ? meta.publiclyVisible
        : typeof meta.publicly_visible === 'boolean'
          ? meta.publicly_visible
          : true,
  }
}

export async function updateBusinessSettings(
  businessId: string,
  input: Partial<BusinessSettings>,
): Promise<BusinessSettings> {
  const { publiclyVisible, metadata, ...rest } = input
  const body: Record<string, unknown> = { ...rest }
  if (publiclyVisible !== undefined || metadata !== undefined) {
    const current = await getBusinessSettings(businessId)
    body.metadata = {
      ...(current.metadata ?? {}),
      ...(metadata ?? {}),
      ...(publiclyVisible !== undefined ? { publiclyVisible } : {}),
    }
  }
  const envelope = await apiClient.patch(
    businessPaths.settings(businessId),
    body,
    (json) => json as BusinessSettings & { metadata?: Record<string, unknown> },
  )
  const data = envelope.data!
  const meta = data.metadata ?? {}
  return {
    ...data,
    publiclyVisible:
      typeof meta.publiclyVisible === 'boolean'
        ? meta.publiclyVisible
        : typeof meta.publicly_visible === 'boolean'
          ? meta.publicly_visible
          : true,
  }
}

export async function listBusinessBranches(businessId: string): Promise<BusinessBranch[]> {
  const envelope = await apiClient.get(businessPaths.branches(businessId), (json) =>
    asArray<BusinessBranch>(json),
  )
  return envelope.data ?? []
}

export async function updateBusinessBranch(
  businessId: string,
  branchId: string,
  input: Partial<BusinessBranch>,
): Promise<BusinessBranch> {
  const envelope = await apiClient.patch(
    businessPaths.branch(businessId, branchId),
    input as unknown as Record<string, unknown>,
    (json) => json as BusinessBranch,
  )
  return envelope.data!
}

export async function getOpeningHours(
  businessId: string,
  branchId?: string | null,
): Promise<OpeningHoursDay[]> {
  const envelope = await apiClient.get(
    `${businessPaths.openingHours(businessId)}${buildQuery({ branchId: branchId ?? undefined })}`,
    (json) => asArray<OpeningHoursDay>(json),
  )
  return envelope.data ?? []
}

export async function replaceOpeningHours(
  businessId: string,
  schedule: OpeningHoursDay[],
  branchId?: string | null,
): Promise<OpeningHoursDay[]> {
  const envelope = await apiClient.put(
    businessPaths.openingHours(businessId),
    { branchId: branchId ?? null, schedule },
    (json) => asArray<OpeningHoursDay>(json),
  )
  return envelope.data ?? []
}

export async function listBusinessServices(
  businessId: string,
  params?: { activeOnly?: boolean },
): Promise<BusinessService[]> {
  const envelope = await apiClient.get(
    `${businessPaths.services(businessId)}${buildQuery({
      activeOnly: params?.activeOnly,
    })}`,
    (json) => asArray<BusinessService>(json),
  )
  return envelope.data ?? []
}

export async function createBusinessService(
  businessId: string,
  input: CreateServiceInput,
): Promise<BusinessService> {
  const envelope = await apiClient.post(
    businessPaths.services(businessId),
    input as unknown as Record<string, unknown>,
    (json) => json as BusinessService,
  )
  return envelope.data!
}

export async function updateBusinessService(
  businessId: string,
  serviceId: string,
  input: Partial<CreateServiceInput>,
): Promise<BusinessService> {
  const envelope = await apiClient.patch(
    businessPaths.service(businessId, serviceId),
    input as unknown as Record<string, unknown>,
    (json) => json as BusinessService,
  )
  return envelope.data!
}

export async function deactivateBusinessService(
  businessId: string,
  serviceId: string,
): Promise<BusinessService> {
  const envelope = await apiClient.delete(
    businessPaths.service(businessId, serviceId),
    (json) => json as BusinessService,
  )
  return envelope.data!
}

export type BusinessProduct = {
  id: string
  businessId: string
  categoryId: string
  name: string
  description: string | null
  sku: string | null
  brand: string | null
  price: number
  salePrice: number | null
  stockStatus: string
  isActive: boolean
}

export async function listBusinessProducts(
  businessId: string,
  params?: { activeOnly?: boolean },
): Promise<BusinessProduct[]> {
  const envelope = await apiClient.get(
    `${businessPaths.products(businessId)}${buildQuery({ activeOnly: params?.activeOnly })}`,
    (json) => asArray<BusinessProduct>(json),
  )
  return envelope.data ?? []
}

export async function createBusinessProduct(
  businessId: string,
  input: {
    categoryId: string
    name: string
    description?: string | null
    sku?: string | null
    brand?: string | null
    price: number
    salePrice?: number | null
    stockStatus?: string
  },
): Promise<BusinessProduct> {
  const envelope = await apiClient.post(
    businessPaths.products(businessId),
    input as Record<string, unknown>,
    (json) => json as BusinessProduct,
  )
  return envelope.data!
}

export async function deactivateBusinessProduct(
  businessId: string,
  productId: string,
): Promise<BusinessProduct> {
  const envelope = await apiClient.delete(
    businessPaths.product(businessId, productId),
    (json) => json as BusinessProduct,
  )
  return envelope.data!
}

export async function listBusinessQuotations(
  businessId: string,
  params?: { status?: string },
): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${businessPaths.quotations(businessId)}${buildQuery({ status: params?.status })}`,
    (json) => asArray<Record<string, unknown>>(json),
  )
  return envelope.data ?? []
}

export async function createQuotationFromAppointment(
  businessId: string,
  appointmentId: string,
  input?: {
    items?: Array<{
      itemType: string
      description: string
      quantity: number
      unitPrice: number
    }>
    customerMessage?: string | null
  },
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.appointmentQuotation(businessId, appointmentId),
    (input ?? {}) as Record<string, unknown>,
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function issueBusinessQuotation(
  businessId: string,
  quotationId: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.quotationIssue(businessId, quotationId),
    {},
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function cancelBusinessQuotation(
  businessId: string,
  quotationId: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.quotationCancel(businessId, quotationId),
    {},
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function listBusinessInvoices(
  businessId: string,
  params?: { status?: string },
): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${businessPaths.invoices(businessId)}${buildQuery({ status: params?.status })}`,
    (json) => asArray<Record<string, unknown>>(json),
  )
  return envelope.data ?? []
}

export async function createInvoiceFromQuotation(
  businessId: string,
  quotationId: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.quotationInvoice(businessId, quotationId),
    {},
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function issueBusinessInvoice(
  businessId: string,
  invoiceId: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.invoiceIssue(businessId, invoiceId),
    {},
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function cancelBusinessInvoice(
  businessId: string,
  invoiceId: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.invoiceCancel(businessId, invoiceId),
    {},
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function recordInvoiceCashPayment(
  businessId: string,
  invoiceId: string,
  amount: number,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.invoiceCashPayment(businessId, invoiceId),
    { amount },
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function listBusinessAppointments(
  businessId: string,
  params?: { status?: string; from?: string; to?: string },
): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${businessPaths.appointments(businessId)}${buildQuery({
      status: params?.status,
      from: params?.from,
      to: params?.to,
    })}`,
    (json) => asArray<Record<string, unknown>>(json),
  )
  return envelope.data ?? []
}

export async function transitionAppointment(
  appointmentId: string,
  action: 'confirm' | 'reject' | 'cancel' | 'arrive' | 'start' | 'complete' | 'no-show',
  body?: { note?: string; reason?: string },
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    platformPaths.appointmentAction(appointmentId, action),
    (body ?? {}) as Record<string, unknown>,
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function listBusinessMembers(businessId: string): Promise<BusinessTeamMember[]> {
  const envelope = await apiClient.get(businessPaths.members(businessId), (json) =>
    asArray<BusinessTeamMember>(json),
  )
  return envelope.data ?? []
}

export async function listBusinessInvitations(businessId: string): Promise<BusinessInvitation[]> {
  const envelope = await apiClient.get(businessPaths.invitations(businessId), (json) =>
    asArray<BusinessInvitation>(json),
  )
  return envelope.data ?? []
}

export async function createBusinessInvitation(
  businessId: string,
  input: { email: string; role: InvitableRole; expiresInDays?: number },
): Promise<{ invitation: BusinessInvitation; token: string }> {
  const envelope = await apiClient.post(
    businessPaths.invitations(businessId),
    input,
    (json) => json as { invitation: BusinessInvitation; token: string },
  )
  return envelope.data!
}

export async function revokeBusinessInvitation(
  businessId: string,
  invitationId: string,
): Promise<BusinessInvitation> {
  const envelope = await apiClient.delete(
    businessPaths.invitation(businessId, invitationId),
    (json) => json as BusinessInvitation,
  )
  return envelope.data!
}

export async function acceptBusinessInvitation(token: string): Promise<{
  invitationId: string
  membershipId: string
  businessId: string
  role: string
}> {
  const envelope = await apiClient.post(
    businessPaths.invitationAccept(token),
    {},
    (json) =>
      json as {
        invitationId: string
        membershipId: string
        businessId: string
        role: string
      },
  )
  return envelope.data!
}
