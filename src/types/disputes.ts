export interface DisputeMessage {
  id: string
  senderUserId: string
  message: string
  createdAt: string
  isFromCustomer: boolean
}

export interface DisputeEvidence {
  id: string
  storagePath: string
  originalFileName: string
  mimeType: string
  uploadedAt: string
}

export interface Dispute {
  id: string
  disputeNumber: string
  businessId: string
  businessName?: string
  customerId: string
  reasonCode: string
  summary: string
  description?: string
  status: string
  appointmentId?: string
  quotationId?: string
  invoiceId?: string
  paymentId?: string
  reviewId?: string
  messages: DisputeMessage[]
  evidence: DisputeEvidence[]
  createdAt: string
}
