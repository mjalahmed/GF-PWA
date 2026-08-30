import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import type {
  IdempotencyRecord,
  IdempotencyRepository,
} from "./idempotency.repository.interface.ts";

export class SupabaseIdempotencyRepository implements IdempotencyRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  async find(
    userId: string,
    operation: string,
    key: string,
  ): Promise<IdempotencyRecord | null> {
    const { data } = await this.adminClient
      .from("idempotency_records")
      .select("*")
      .eq("user_id", userId)
      .eq("operation", operation)
      .eq("idempotency_key", key)
      .maybeSingle();

    if (!data) return null;
    return {
      idempotencyKey: data.idempotency_key,
      userId: data.user_id,
      operation: data.operation,
      requestHash: data.request_hash,
      responseStatus: data.response_status,
      responseBody: data.response_body,
      expiresAt: data.expires_at,
    };
  }

  async save(record: IdempotencyRecord): Promise<void> {
    await this.adminClient.from("idempotency_records").insert({
      idempotency_key: record.idempotencyKey,
      user_id: record.userId,
      operation: record.operation,
      request_hash: record.requestHash,
      response_status: record.responseStatus,
      response_body: record.responseBody,
      expires_at: record.expiresAt,
    });
  }
}
