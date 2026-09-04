import type {
  BusinessInvitation,
  BusinessMembership,
  BusinessTeamMember,
  InvitableRole,
} from '../../types/business'
import type { Appointment } from '../../types/appointments'
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
import { mapAppointment, mapReview } from '../../lib/mappers'
import { mapList } from '../../lib/map'
import type { Review } from '../../types/reviews'
import { apiClient, buildQuery } from './client'
import { businessPaths, platformPaths } from './paths'

function asArray<T>(json: unknown): T[] {
  return Array.isArray(json) ? (json as T[]) : []
}

function metaBool(
  data: Record<string, unknown>,
  meta: Record<string, unknown>,
  camel: string,
  snake: string,
  fallback: boolean,
): boolean {
  if (typeof data[camel] === 'boolean') return data[camel] as boolean
  if (typeof data[snake] === 'boolean') return data[snake] as boolean
  if (typeof meta[camel] === 'boolean') return meta[camel] as boolean
  if (typeof meta[snake] === 'boolean') return meta[snake] as boolean
  return fallback
}

function metaStr(
  data: Record<string, unknown>,
  meta: Record<string, unknown>,
  camel: string,
  snake: string,
): string | null | undefined {
  const v = data[camel] ?? data[snake] ?? meta[camel] ?? meta[snake]
  if (v == null) return v as null | undefined
  return String(v)
}

export function normalizeBusinessSettings(raw: unknown): BusinessSettings {
  const data = (raw ?? {}) as BusinessSettings & Record<string, unknown>
  const meta = (data.metadata ?? {}) as Record<string, unknown>
  return {
    ...data,
    businessId: String(data.businessId ?? data.business_id ?? ''),
    appointmentsEnabled: Boolean(data.appointmentsEnabled ?? data.appointments_enabled),
    publiclyVisible:
      data.publiclyVisible !== undefined
        ? Boolean(data.publiclyVisible)
        : metaBool(data, meta, 'publiclyVisible', 'publicly_visible', true),
    acceptNewCustomers:
      data.acceptNewCustomers !== undefined
        ? Boolean(data.acceptNewCustomers)
        : metaBool(data, meta, 'acceptNewCustomers', 'accept_new_customers', true),
    benefitPayEnabled: Boolean(
      data.benefitpayPaymentsEnabled ??
        data.benefitPayEnabled ??
        data.benefit_pay_enabled ??
        meta.benefitPayEnabled ??
        false,
    ),
    benefitPayPhone:
      (data.benefitpayPhone as string | null | undefined) ??
      metaStr(data, meta, 'benefitPayPhone', 'benefit_pay_phone') ??
      null,
    benefitPayIban:
      (data.benefitpayIban as string | null | undefined) ??
      metaStr(data, meta, 'benefitPayIban', 'benefit_pay_iban') ??
      null,
    benefitPayInstructions:
      (data.benefitpayInstructions as string | null | undefined) ??
      metaStr(data, meta, 'benefitPayInstructions', 'benefit_pay_instructions') ??
      null,
  }
}

/** Map PWA settings fields to canonical backend settings keys. */
export function toBusinessSettingsWriteBody(
  input: Partial<BusinessSettings>,
): Record<string, unknown> {
  const {
    publiclyVisible,
    acceptNewCustomers,
    benefitPayEnabled,
    benefitPayPhone,
    benefitPayIban,
    benefitPayInstructions,
    metadata,
    businessId: _businessId,
    ...rest
  } = input
  const body: Record<string, unknown> = { ...rest }
  if (publiclyVisible !== undefined) body.publiclyVisible = publiclyVisible
  if (acceptNewCustomers !== undefined) body.acceptNewCustomers = acceptNewCustomers
  if (benefitPayEnabled !== undefined) body.benefitpayPaymentsEnabled = benefitPayEnabled
  if (benefitPayPhone !== undefined) body.benefitpayPhone = benefitPayPhone
  if (benefitPayIban !== undefined) body.benefitpayIban = benefitPayIban
  if (benefitPayInstructions !== undefined) {
    body.benefitpayInstructions = benefitPayInstructions
  }
  if (metadata !== undefined) body.metadata = metadata
  return body
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
    logoPath: string | null
    coverPath: string | null
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
  const envelope = await apiClient.get(businessPaths.settings(businessId), (json) => json)
  return normalizeBusinessSettings(envelope.data)
}

export async function updateBusinessSettings(
  businessId: string,
  input: Partial<BusinessSettings>,
): Promise<BusinessSettings> {
  const envelope = await apiClient.patch(
    businessPaths.settings(businessId),
    toBusinessSettingsWriteBody(input),
    (json) => json,
  )
  return normalizeBusinessSettings(envelope.data)
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

export async function getBusinessQuotation(
  businessId: string,
  quotationId: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.get(
    businessPaths.quotation(businessId, quotationId),
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
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

export async function getBusinessAppointment(
  businessId: string,
  appointmentId: string,
): Promise<Appointment> {
  const envelope = await apiClient.get(
    businessPaths.appointment(businessId, appointmentId),
    (json) => json as Record<string, unknown>,
  )
  return mapAppointment(envelope.data!)
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

export async function setAppointmentStatus(
  appointmentId: string,
  status: string,
  note?: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    platformPaths.appointmentStatus(appointmentId),
    { status, ...(note ? { note } : {}) },
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function registerAppointmentMedia(
  businessId: string,
  appointmentId: string,
  input: {
    phase: 'before' | 'during' | 'after'
    storagePath: string
    caption?: string | null
    sortOrder?: number
  },
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.appointmentMedia(businessId, appointmentId),
    input as Record<string, unknown>,
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function confirmInvoicePayment(
  businessId: string,
  invoiceId: string,
  paymentId: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.invoicePaymentConfirm(businessId, invoiceId, paymentId),
    {},
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function sendInvoicePaymentReminder(
  businessId: string,
  invoiceId: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.invoicePaymentReminder(businessId, invoiceId),
    {},
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function requestReviewDispute(
  businessId: string,
  reviewId: string,
  reasonCode = 'other',
  details?: string,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    businessPaths.reviewReport(businessId, reviewId),
    { reasonCode, details: details ?? null },
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return envelope.data!
}

export async function listGarageReviews(businessId: string): Promise<Review[]> {
  const envelope = await apiClient.get(businessPaths.reviews(businessId), (json) => json)
  return mapList(envelope.data, mapReview)
}

export async function createCustomerVehicle(
  businessId: string,
  input: {
    customerId: string
    sourceAppointmentId?: string | null
    makeText?: string
    modelText?: string
    makeId?: string | null
    modelId?: string | null
    year: number
    registrationNumber?: string | null
    color?: string | null
    vin?: string | null
    mileage?: number | null
    imagePath?: string | null
    vehicleType?: string | null
    bodyType?: string | null
    fuelType?: string | null
    transmission?: string | null
  },
): Promise<Record<string, unknown>> {
  const { vehicleType, bodyType, ...rest } = input
  const type = vehicleType ?? bodyType
  const envelope = await apiClient.post(
    businessPaths.customerVehicles(businessId),
    {
      ...rest,
      ...(type != null ? { vehicleType: type, bodyType: type } : {}),
    } as Record<string, unknown>,
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
