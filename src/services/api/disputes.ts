import type { Dispute, DisputeEvidence } from '../../types/disputes'
import { mapDispute, mapDisputeEvidence, mapDisputeMessage } from '../../lib/mappers'
import { apiClient, buildQuery } from './client'

export async function listDisputes(params?: { status?: string }): Promise<Dispute[]> {
  const envelope = await apiClient.get(
    `/v1/disputes${buildQuery({ status: params?.status })}`,
    (json) => (Array.isArray(json) ? json : []) as unknown[],
  )
  return (envelope.data ?? []).map((item) => mapDispute(item as Record<string, unknown>))
}

export async function getDispute(id: string): Promise<Dispute> {
  const envelope = await apiClient.get(`/v1/disputes/${id}`, (json) => json as Record<string, unknown>)
  return mapDispute(envelope.data!)
}

export async function createDispute(body: {
  businessId: string
  reasonCode: string
  summary: string
  description?: string
  appointmentId?: string
  quotationId?: string
  invoiceId?: string
  paymentId?: string
  reviewId?: string
  initialMessage?: string
}): Promise<Dispute> {
  const envelope = await apiClient.post('/v1/disputes', body, (json) => json as Record<string, unknown>)
  return mapDispute(envelope.data!)
}

export async function postDisputeMessage(disputeId: string, message: string) {
  const envelope = await apiClient.post(
    `/v1/disputes/${disputeId}/messages`,
    { message },
    (json) => json as Record<string, unknown>,
  )
  return mapDisputeMessage(envelope.data!)
}

export async function registerDisputeEvidence(
  disputeId: string,
  body: { originalFileName: string; mimeType: string; fileSizeBytes: number; description?: string },
): Promise<DisputeEvidence & { storagePath?: string; uploadUrl?: string }> {
  const envelope = await apiClient.post(
    `/v1/disputes/${disputeId}/evidence`,
    body,
    (json) => json as Record<string, unknown>,
  )
  return { ...mapDisputeEvidence(envelope.data!), ...(envelope.data as object) }
}

export async function withdrawDispute(id: string): Promise<Dispute> {
  const envelope = await apiClient.post(`/v1/disputes/${id}/withdraw`, {}, (json) => json as Record<string, unknown>)
  return mapDispute(envelope.data!)
}
