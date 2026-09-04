export type ProductOrderFulfillmentMethod = 'pickup' | 'delivery' | 'collection' | 'other'

export type ProductOrderStatus =
  | 'created'
  | 'confirmed'
  | 'processing'
  | 'ready_for_pickup'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'disputed'

export interface ProductOrderItem {
  id: string
  productId: string | null
  productName: string
  sku?: string | null
  quantity: number
  unitPrice: number
  discountAmount: number
  taxAmount: number
  lineTotal: number
  sortOrder: number
}

export interface ProductOrder {
  id: string
  orderNumber: string
  customerId: string
  businessId: string
  branchId?: string | null
  status: ProductOrderStatus | string
  fulfillmentMethod: ProductOrderFulfillmentMethod | string
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  currency: string
  customerNotes?: string | null
  businessNotes?: string | null
  deliveryAddress?: string | null
  cancelledAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  items: ProductOrderItem[]
}

export const PRODUCT_ORDER_NEXT_STATUSES: Record<string, string[]> = {
  created: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready_for_pickup', 'out_for_delivery', 'cancelled'],
  ready_for_pickup: ['completed', 'cancelled'],
  out_for_delivery: ['completed', 'cancelled'],
  completed: ['disputed', 'refunded'],
  cancelled: [],
  refunded: [],
  disputed: ['refunded', 'completed'],
}
