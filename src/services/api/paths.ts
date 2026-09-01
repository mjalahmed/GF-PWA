/** API path helpers — aligned with backend audience prefixes. */
const V1 = '/v1'

export const platformPaths = {
  me: `${V1}/me`,
  profile: `${V1}/profiles/me`,
  health: `${V1}/health`,
  appointment: (id: string) => `${V1}/appointments/${id}`,
  appointmentAction: (id: string, action: string) => `${V1}/appointments/${id}/${action}`,
} as const

export const customerPaths = {
  discovery: {
    businesses: `${V1}/customer/discovery/businesses`,
    business: (slug: string) => `${V1}/customer/discovery/businesses/${slug}`,
    services: (slug: string) => `${V1}/customer/discovery/businesses/${slug}/services`,
    products: (slug: string) => `${V1}/customer/discovery/businesses/${slug}/products`,
  },
  catalog: {
    serviceCategories: `${V1}/customer/service-categories`,
    productCategories: `${V1}/customer/product-categories`,
    vehicleMakes: `${V1}/customer/vehicle-makes`,
    vehicleModels: (makeId: string) => `${V1}/customer/vehicle-makes/${makeId}/models`,
  },
  businessPublic: (businessId: string) => `${V1}/customer/businesses/${businessId}/public`,
  businessReviews: (businessId: string) => `${V1}/customer/businesses/${businessId}/reviews`,
  appointmentSlots: (businessId: string, branchId: string) =>
    `${V1}/customer/businesses/${businessId}/branches/${branchId}/appointment-slots`,
  favorites: `${V1}/customer/favorites`,
  favorite: (businessId: string) => `${V1}/customer/favorites/${businessId}`,
  appointments: `${V1}/customer/appointments`,
  vehicles: `${V1}/customer/vehicles`,
  vehicle: (id: string) => `${V1}/customer/vehicles/${id}`,
  vehicleDefault: (id: string) => `${V1}/customer/vehicles/${id}/make-default`,
  quotations: `${V1}/customer/quotations`,
  quotation: (id: string) => `${V1}/customer/quotations/${id}`,
  quotationAction: (id: string, action: string) => `${V1}/customer/quotations/${id}/${action}`,
  invoices: `${V1}/customer/invoices`,
  invoice: (id: string) => `${V1}/customer/invoices/${id}`,
  invoiceAction: (id: string, action: string) => `${V1}/customer/invoices/${id}/${action}`,
  invoicePayments: (invoiceId: string) => `${V1}/customer/invoices/${invoiceId}/payments`,
  payments: `${V1}/customer/payments`,
  payment: (id: string) => `${V1}/customer/payments/${id}`,
  reviewEligibilities: `${V1}/customer/review-eligibilities`,
  reviewEligibility: (id: string) => `${V1}/customer/review-eligibilities/${id}`,
  reviews: `${V1}/customer/reviews`,
  review: (id: string) => `${V1}/customer/reviews/${id}`,
  reviewReport: (id: string) => `${V1}/customer/reviews/${id}/report`,
  disputes: `${V1}/customer/disputes`,
  dispute: (id: string) => `${V1}/customer/disputes/${id}`,
  disputeMessages: (id: string) => `${V1}/customer/disputes/${id}/messages`,
  disputeEvidence: (id: string) => `${V1}/customer/disputes/${id}/evidence`,
  disputeWithdraw: (id: string) => `${V1}/customer/disputes/${id}/withdraw`,
} as const

export const businessPaths = {
  memberships: `${V1}/business/memberships`,
  applications: `${V1}/business/applications`,
  application: (id: string) => `${V1}/business/applications/${id}`,
  invitationAccept: (token: string) => `${V1}/business/invitations/${token}/accept`,
  business: (businessId: string) => `${V1}/business/businesses/${businessId}`,
  branches: (businessId: string) => `${V1}/business/businesses/${businessId}/branches`,
  appointments: (businessId: string) => `${V1}/business/businesses/${businessId}/appointments`,
  quotations: (businessId: string) => `${V1}/business/businesses/${businessId}/quotations`,
  invoices: (businessId: string) => `${V1}/business/businesses/${businessId}/invoices`,
  disputes: (businessId: string) => `${V1}/business/businesses/${businessId}/disputes`,
} as const

export const adminPaths = {
  applications: `${V1}/admin/applications`,
  application: (id: string) => `${V1}/admin/applications/${id}`,
  applicationAction: (id: string, action: string) => `${V1}/admin/applications/${id}/${action}`,
  reviews: `${V1}/admin/reviews`,
  review: (id: string) => `${V1}/admin/reviews/${id}`,
  reviewAction: (id: string, action: string) => `${V1}/admin/reviews/${id}/${action}`,
  reviewReports: `${V1}/admin/review-reports`,
  reviewReportAction: (reportId: string, action: string) =>
    `${V1}/admin/review-reports/${reportId}/${action}`,
  disputes: `${V1}/admin/disputes`,
  dispute: (id: string) => `${V1}/admin/disputes/${id}`,
  disputeAction: (id: string, action: string) => `${V1}/admin/disputes/${id}/${action}`,
} as const
