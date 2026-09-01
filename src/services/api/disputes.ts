import { apiClient, buildQuery } from './client'
import { customerPaths } from './paths'

export async function listDisputes(params?: { status?: string }): Promise<Record<string, unknown>[]> {
  const envelope = await apiClient.get(
    `${customerPaths.disputes}${buildQuery({ status: params?.status })}`,
    (json) => (Array.isArray(json) ? json : []),
  )
  return (envelope.data ?? []) as Record<string, unknown>[]
}

export async function getDispute(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.get(customerPaths.dispute(id), (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function createDispute(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(customerPaths.disputes, body, (json) => json as Record<string, unknown>)
  return envelope.data!
}

export async function postDisputeMessage(
  disputeId: string,
  body: { message: string },
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    customerPaths.disputeMessages(disputeId),
    body,
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function postDisputeEvidence(
  disputeId: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(
    customerPaths.disputeEvidence(disputeId),
    body,
    (json) => json as Record<string, unknown>,
  )
  return envelope.data!
}

export async function withdrawDispute(id: string): Promise<Record<string, unknown>> {
  const envelope = await apiClient.post(customerPaths.disputeWithdraw(id), {}, (json) => json as Record<string, unknown>)
  return envelope.data!
}
