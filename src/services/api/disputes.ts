import type { Dispute } from '../../types/disputes'
import { mapDispute } from '../../lib/mappers'
import { mapList } from '../../lib/map'
import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listDisputes(params?: { status?: string }): Promise<Dispute[]> {
  const envelope = await apiClient.get(
    `${customerPaths.disputes}${buildQuery({ status: params?.status })}`,
    (json) => json,
  )
  return mapList(envelope.data, mapDispute)
}

export async function getDispute(id: string): Promise<Dispute> {
  const envelope = await apiClient.get(customerPaths.dispute(id), (json) => json as Record<string, unknown>)
  return mapDispute(envelope.data!)
}

export async function createDispute(body: {
  businessId: string
  reasonCode: string
  summary: string
  description?: string
  initialMessage?: string
  appointmentId?: string
  invoiceId?: string
  quotationId?: string
}): Promise<Dispute> {
  const envelope = await apiClient.post(customerPaths.disputes, body, (json) => json as Record<string, unknown>)
  return mapDispute(envelope.data!)
}

export async function postDisputeMessage(disputeId: string, message: string): Promise<Dispute> {
  const envelope = await apiClient.post(
    customerPaths.disputeMessages(disputeId),
    { message },
    (json) => json as Record<string, unknown>,
  )
  return mapDispute(envelope.data!)
}

export async function postDisputeEvidence(
  disputeId: string,
  body: Record<string, unknown>,
): Promise<Dispute> {
  const envelope = await apiClient.post(
    customerPaths.disputeEvidence(disputeId),
    body,
    (json) => json as Record<string, unknown>,
  )
  return mapDispute(envelope.data!)
}

export async function withdrawDispute(id: string): Promise<Dispute> {
  const envelope = await apiClient.post(
    customerPaths.disputeWithdraw(id),
    {},
    (json) => json as Record<string, unknown>,
  )
  return mapDispute(envelope.data!)
}
