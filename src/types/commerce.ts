export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  businessId: string
  businessName?: string
  grandTotal: number
  remainingTotal: number
  currency: string
  requiresCustomerApproval: boolean
  items: LineItem[]
  issuedAt?: string
  dueAt?: string
  /** Optional payment capability hints from enriched invoice payloads */
  cashPaymentsEnabled?: boolean
  benefitPayEnabled?: boolean
  benefitPayPhone?: string | null
  benefitPayIban?: string | null
  benefitPayInstructions?: string | null
}

export interface Payment {
  id: string
  paymentReference: string
  amount: number
  method: string
  status: string
  paidAt?: string
}

export interface Quotation {
  id: string
  quotationNumber: string
  status: string
  businessId: string
  businessName?: string
  grandTotal: number
  currency: string
  items: LineItem[]
  validUntil?: string
}
