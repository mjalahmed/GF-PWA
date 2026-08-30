import type { PaymentMethod } from "../../core/constants/statuses.ts";

export type InitiatePaymentInput = {
  invoiceId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customerId: string;
  businessId: string;
  idempotencyKey?: string;
};

export type InitiatePaymentResult = {
  providerPaymentId: string;
  status: string;
  redirectUrl?: string | null;
};

export type ProviderPaymentState = {
  providerPaymentId: string;
  status: string;
  amount: number;
  currency: string;
};

export type RefundPaymentInput = {
  paymentId: string;
  amount: number;
  reason?: string | null;
};

export type RefundPaymentResult = {
  providerRefundId: string;
  status: string;
  amount: number;
};

export type VerifiedProviderEvent = {
  provider: string;
  eventType: string;
  providerEventId: string;
  paymentId?: string | null;
  payload: Record<string, unknown>;
};

/**
 * Provider-neutral payment interface for future online integrations.
 * Phase 8 implements cash only via PostgreSQL RPC — no concrete providers.
 */
export interface PaymentProvider {
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  retrievePayment(providerPaymentId: string): Promise<ProviderPaymentState>;
  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult>;
  verifyWebhook(request: Request): Promise<VerifiedProviderEvent>;
}
