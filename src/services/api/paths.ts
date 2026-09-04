/** API path helpers — aligned with backend audience prefixes. */
const V1 = '/v1'

export const platformPaths = {
  me: `${V1}/me`,
  profile: `${V1}/profiles/me`,
  health: `${V1}/health`,
  notifications: `${V1}/notifications`,
  notificationUnreadCount: `${V1}/notifications/unread-count`,
  notificationRead: (id: string) => `${V1}/notifications/${id}/read`,
  notificationsReadAll: `${V1}/notifications/read-all`,
  pushSubscriptions: `${V1}/push-subscriptions`,
  legalAcceptances: `${V1}/legal/acceptances`,
  appointment: (id: string) => `${V1}/appointments/${id}`,
  appointmentAction: (id: string, action: string) => `${V1}/appointments/${id}/${action}`,
  appointmentStatus: (id: string) => `${V1}/appointments/${id}/status`,
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
  vehicleServiceHistory: (id: string) => `${V1}/customer/vehicles/${id}/service-history`,
  vehicleHistoryDetail: (id: string) => `${V1}/customer/vehicles/${id}/history-detail`,
  quotations: `${V1}/customer/quotations`,
  quotation: (id: string) => `${V1}/customer/quotations/${id}`,
  quotationAction: (id: string, action: string) => `${V1}/customer/quotations/${id}/${action}`,
  invoices: `${V1}/customer/invoices`,
  invoice: (id: string) => `${V1}/customer/invoices/${id}`,
  invoiceAction: (id: string, action: string) => `${V1}/customer/invoices/${id}/${action}`,
  invoicePayments: (invoiceId: string) => `${V1}/customer/invoices/${invoiceId}/payments`,
  invoiceBenefitPay: (invoiceId: string) =>
    `${V1}/customer/invoices/${invoiceId}/payments/benefitpay`,
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
  quoteRequests: `${V1}/customer/quote-requests`,
  emergencyRequests: `${V1}/customer/emergency-requests`,
  announcements: `${V1}/customer/announcements`,
  appointmentMedia: (appointmentId: string) =>
    `${V1}/customer/appointments/${appointmentId}/media`,
  productOrders: `${V1}/customer/product-orders`,
  vehiclesPendingConfirmation: `${V1}/customer/vehicles/pending-confirmation`,
  vehicleConfirm: (id: string) => `${V1}/customer/vehicles/${id}/confirm`,
  vehicleReject: (id: string) => `${V1}/customer/vehicles/${id}/reject`,
} as const

export const businessPaths = {
  memberships: `${V1}/business/memberships`,
  businessCategories: `${V1}/business/business-categories`,
  businessCategoryRequirements: (categoryId: string) =>
    `${V1}/business/business-categories/${categoryId}/document-requirements`,
  applications: `${V1}/business/applications`,
  application: (id: string) => `${V1}/business/applications/${id}`,
  applicationBranch: (id: string) => `${V1}/business/applications/${id}/branch`,
  applicationSubmit: (id: string) => `${V1}/business/applications/${id}/submit`,
  applicationWithdraw: (id: string) => `${V1}/business/applications/${id}/withdraw`,
  applicationDocuments: (id: string) => `${V1}/business/applications/${id}/documents`,
  applicationDocument: (id: string, documentId: string) =>
    `${V1}/business/applications/${id}/documents/${documentId}`,
  invitationAccept: (token: string) => `${V1}/business/invitations/${token}/accept`,
  business: (businessId: string) => `${V1}/business/businesses/${businessId}`,
  settings: (businessId: string) => `${V1}/business/businesses/${businessId}/settings`,
  members: (businessId: string) => `${V1}/business/businesses/${businessId}/members`,
  invitations: (businessId: string) => `${V1}/business/businesses/${businessId}/invitations`,
  invitation: (businessId: string, invitationId: string) =>
    `${V1}/business/businesses/${businessId}/invitations/${invitationId}`,
  branches: (businessId: string) => `${V1}/business/businesses/${businessId}/branches`,
  branch: (businessId: string, branchId: string) =>
    `${V1}/business/businesses/${businessId}/branches/${branchId}`,
  openingHours: (businessId: string) => `${V1}/business/businesses/${businessId}/opening-hours`,
  services: (businessId: string) => `${V1}/business/businesses/${businessId}/services`,
  service: (businessId: string, serviceId: string) =>
    `${V1}/business/businesses/${businessId}/services/${serviceId}`,
  appointments: (businessId: string) => `${V1}/business/businesses/${businessId}/appointments`,
  appointment: (businessId: string, appointmentId: string) =>
    `${V1}/business/businesses/${businessId}/appointments/${appointmentId}`,
  appointmentMedia: (businessId: string, appointmentId: string) =>
    `${V1}/business/businesses/${businessId}/appointments/${appointmentId}/media`,
  products: (businessId: string) => `${V1}/business/businesses/${businessId}/products`,
  product: (businessId: string, productId: string) =>
    `${V1}/business/businesses/${businessId}/products/${productId}`,
  reviews: (businessId: string) => `${V1}/business/businesses/${businessId}/reviews`,
  reviewReport: (businessId: string, reviewId: string) =>
    `${V1}/business/businesses/${businessId}/reviews/${reviewId}/report`,
  /** @deprecated use reviewReport */
  reviewDispute: (businessId: string, reviewId: string) =>
    `${V1}/business/businesses/${businessId}/reviews/${reviewId}/report`,
  productOrders: (businessId: string) =>
    `${V1}/business/businesses/${businessId}/product-orders`,
  productOrderStatus: (businessId: string, orderId: string) =>
    `${V1}/business/businesses/${businessId}/product-orders/${orderId}/status`,
  customerVehicles: (businessId: string) =>
    `${V1}/business/businesses/${businessId}/customer-vehicles`,
  quotations: (businessId: string) => `${V1}/business/businesses/${businessId}/quotations`,
  quotation: (businessId: string, quotationId: string) =>
    `${V1}/business/businesses/${businessId}/quotations/${quotationId}`,
  quotationIssue: (businessId: string, quotationId: string) =>
    `${V1}/business/businesses/${businessId}/quotations/${quotationId}/issue`,
  quotationCancel: (businessId: string, quotationId: string) =>
    `${V1}/business/businesses/${businessId}/quotations/${quotationId}/cancel`,
  appointmentQuotation: (businessId: string, appointmentId: string) =>
    `${V1}/business/businesses/${businessId}/appointments/${appointmentId}/quotation`,
  invoices: (businessId: string) => `${V1}/business/businesses/${businessId}/invoices`,
  invoice: (businessId: string, invoiceId: string) =>
    `${V1}/business/businesses/${businessId}/invoices/${invoiceId}`,
  invoiceIssue: (businessId: string, invoiceId: string) =>
    `${V1}/business/businesses/${businessId}/invoices/${invoiceId}/issue`,
  invoiceCancel: (businessId: string, invoiceId: string) =>
    `${V1}/business/businesses/${businessId}/invoices/${invoiceId}/cancel`,
  quotationInvoice: (businessId: string, quotationId: string) =>
    `${V1}/business/businesses/${businessId}/quotations/${quotationId}/invoice`,
  invoiceCashPayment: (businessId: string, invoiceId: string) =>
    `${V1}/business/businesses/${businessId}/invoices/${invoiceId}/payments/cash`,
  invoicePaymentConfirm: (businessId: string, invoiceId: string, paymentId: string) =>
    `${V1}/business/businesses/${businessId}/invoices/${invoiceId}/payments/${paymentId}/confirm`,
  invoicePaymentReminder: (businessId: string, invoiceId: string) =>
    `${V1}/business/businesses/${businessId}/invoices/${invoiceId}/remind-payment`,
  disputes: (businessId: string) => `${V1}/business/businesses/${businessId}/disputes`,
} as const

export const adminPaths = {
  applications: `${V1}/admin/applications`,
  application: (id: string) => `${V1}/admin/applications/${id}`,
  applicationAction: (id: string, action: string) => `${V1}/admin/applications/${id}/${action}`,
  applicationDocumentReview: (id: string, documentId: string) =>
    `${V1}/admin/applications/${id}/documents/${documentId}/review`,
  applicationDocumentDownloadUrl: (id: string, documentId: string) =>
    `${V1}/admin/applications/${id}/documents/${documentId}/download-url`,
  businesses: `${V1}/admin/businesses`,
  business: (businessId: string) => `${V1}/admin/businesses/${businessId}`,
  businessSettings: (businessId: string) => `${V1}/admin/businesses/${businessId}/settings`,
  users: `${V1}/admin/users`,
  user: (userId: string) => `${V1}/admin/users/${userId}`,
  vehicles: `${V1}/admin/vehicles`,
  vehicle: (vehicleId: string) => `${V1}/admin/vehicles/${vehicleId}`,
  vehicleAction: (vehicleId: string, action: string) =>
    `${V1}/admin/vehicles/${vehicleId}/${action}`,
  appointments: `${V1}/admin/appointments`,
  appointment: (appointmentId: string) => `${V1}/admin/appointments/${appointmentId}`,
  reviews: `${V1}/admin/reviews`,
  review: (id: string) => `${V1}/admin/reviews/${id}`,
  reviewAction: (id: string, action: string) => `${V1}/admin/reviews/${id}/${action}`,
  reviewReports: `${V1}/admin/review-reports`,
  reviewReportAction: (reportId: string, action: string) =>
    `${V1}/admin/review-reports/${reportId}/${action}`,
  disputes: `${V1}/admin/disputes`,
  dispute: (id: string) => `${V1}/admin/disputes/${id}`,
  disputeAction: (id: string, action: string) => `${V1}/admin/disputes/${id}/${action}`,
  transactions: `${V1}/admin/transactions`,
  transaction: (paymentId: string) => `${V1}/admin/transactions/${paymentId}`,
} as const
