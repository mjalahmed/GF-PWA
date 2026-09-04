export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'withdrawn'

export type ApplicationStep =
  | 'business_information'
  | 'contact_information'
  | 'branch_information'
  | 'documents'
  | 'review_and_submit'

export type BusinessCategory = {
  id: string
  code: string
  name: string
  description: string | null
  sortOrder: number
}

export type DocumentRequirement = {
  id: string
  businessCategoryId: string
  documentType: string
  displayName: string
  description: string | null
  isRequired: boolean
  requiresExpiryDate: boolean
  allowedMimeTypes: string[]
  maximumFileSizeBytes: number
  sortOrder: number
}

export type BusinessApplication = {
  id: string
  applicantUserId: string
  businessCategoryId: string
  legalName: string
  displayName: string
  description: string | null
  commercialRegistrationNumber: string | null
  phone: string
  email: string
  website: string | null
  status: ApplicationStatus | string
  currentStep: ApplicationStep | string
  submittedAt: string | null
  reviewStartedAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
  withdrawnAt: string | null
  changesRequestedAt: string | null
  rejectionReason: string | null
  changesRequestedReason: string | null
  assignedReviewerId: string | null
  createdBusinessId: string | null
  createdAt: string
  updatedAt: string
}

export type ApplicationBranch = {
  id: string
  applicationId: string
  name: string | null
  phone: string | null
  email: string | null
  addressLine: string | null
  area: string | null
  city: string | null
  countryCode: string
  latitude: number | null
  longitude: number | null
  timezone: string
  createdAt: string
  updatedAt: string
}

export type ApplicationDocument = {
  id: string
  applicationId: string
  documentRequirementId: string
  documentType: string
  storagePath: string
  originalFileName: string
  mimeType: string
  fileSizeBytes: number
  documentNumber: string | null
  expiresAt: string | null
  status: string
  rejectionReason: string | null
  uploadedBy: string
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ApplicationReview = {
  id: string
  applicationId: string
  reviewerUserId: string
  action: string
  previousStatus: string | null
  newStatus: string | null
  reason: string | null
  notes: string | null
  createdAt: string
}

export type ApplicationDetail = {
  application: BusinessApplication
  branch: ApplicationBranch | null
  steps: Array<{
    id: string
    applicationId: string
    stepCode: string
    status: string
    data: Record<string, unknown>
    completedAt: string | null
    createdAt: string
    updatedAt: string
  }>
  documents: ApplicationDocument[]
  requirements: DocumentRequirement[]
  reviews: ApplicationReview[]
}

export type CreateApplicationInput = {
  businessCategoryId: string
  legalName: string
  displayName: string
  description?: string | null
  commercialRegistrationNumber?: string | null
  phone: string
  email: string
  website?: string | null
}

export type UpdateApplicationInput = Partial<CreateApplicationInput> & {
  currentStep?: ApplicationStep
}

export type UpdateApplicationBranchInput = {
  name?: string | null
  phone?: string | null
  email?: string | null
  addressLine?: string | null
  area?: string | null
  city?: string | null
  countryCode?: string
  latitude?: number | null
  longitude?: number | null
  timezone?: string
}

export type BusinessBranch = {
  id: string
  businessId: string
  name: string | null
  phone: string | null
  email: string | null
  addressLine: string | null
  area: string | null
  city: string | null
  countryCode: string
  latitude: number | null
  longitude: number | null
  timezone: string
  isPrimary?: boolean
  createdAt?: string
  updatedAt?: string
}

export type BusinessSettings = {
  businessId: string
  appointmentsEnabled: boolean
  productsEnabled?: boolean
  quotationsEnabled?: boolean
  invoicesEnabled?: boolean
  cashPaymentsEnabled?: boolean
  onlinePaymentsEnabled?: boolean
  reviewsEnabled?: boolean
  autoConfirmAppointments?: boolean
  defaultAppointmentDurationMinutes?: number | null
  minimumBookingNoticeMinutes?: number | null
  maximumBookingDaysAhead?: number | null
  cancellationNoticeMinutes?: number | null
  currency?: string
  locale?: string
  timezone?: string
  /** Soft discovery visibility flag stored in settings.metadata until a first-class column exists. */
  publiclyVisible?: boolean
  metadata?: Record<string, unknown>
}

export type OpeningHoursDay = {
  dayOfWeek: number
  isClosed: boolean
  opensAt?: string | null
  closesAt?: string | null
}

export type ServicePricingType =
  | 'fixed'
  | 'starting_from'
  | 'range'
  | 'quote_required'
  | 'free'

export type BusinessService = {
  id: string
  businessId: string
  branchId: string | null
  categoryId: string
  name: string
  description: string | null
  pricingType: ServicePricingType | string
  price: number | null
  minimumPrice: number | null
  maximumPrice: number | null
  estimatedDurationMinutes: number | null
  requiresAppointment: boolean
  requiresVehicle: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateServiceInput = {
  categoryId: string
  name: string
  description?: string | null
  pricingType: ServicePricingType
  price?: number | null
  minimumPrice?: number | null
  maximumPrice?: number | null
  estimatedDurationMinutes?: number | null
  requiresAppointment?: boolean
  requiresVehicle?: boolean
  branchId?: string | null
}

export type BusinessProfile = {
  id: string
  slug: string
  displayName: string
  description: string | null
  phone: string | null
  email: string | null
  website: string | null
  logoPath: string | null
  coverPath: string | null
  status: string
  verificationStatus: string
}
