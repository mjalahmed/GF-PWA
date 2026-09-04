import type { ProductOrder, ProductOrderFulfillmentMethod } from '../../types/orders'
import { mapProductOrder } from '../../lib/mappers'
import { mapList } from '../../lib/map'
import { apiClient } from './client'
import { businessPaths, customerPaths } from './paths'

export async function listProductOrders(): Promise<ProductOrder[]> {
  const envelope = await apiClient.get(customerPaths.productOrders, (json) => json)
  return mapList(envelope.data, mapProductOrder)
}

export async function getProductOrder(orderId: string): Promise<ProductOrder | null> {
  const orders = await listProductOrders()
  return orders.find((o) => o.id === orderId) ?? null
}

export async function createProductOrder(body: {
  businessId: string
  branchId?: string
  fulfillmentMethod?: ProductOrderFulfillmentMethod
  customerNotes?: string
  deliveryAddress?: string
  items: Array<{ productId: string; quantity: number }>
}): Promise<ProductOrder> {
  const envelope = await apiClient.post(
    customerPaths.productOrders,
    body as Record<string, unknown>,
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return mapProductOrder(envelope.data!)
}

export async function listBusinessProductOrders(businessId: string): Promise<ProductOrder[]> {
  const envelope = await apiClient.get(businessPaths.productOrders(businessId), (json) => json)
  return mapList(envelope.data, mapProductOrder)
}

export async function updateProductOrderStatus(
  businessId: string,
  orderId: string,
  status: string,
  note?: string,
): Promise<ProductOrder> {
  const envelope = await apiClient.post(
    businessPaths.productOrderStatus(businessId, orderId),
    { status, ...(note ? { note } : {}) },
    (json) => json as Record<string, unknown>,
    crypto.randomUUID(),
  )
  return mapProductOrder(envelope.data!)
}
