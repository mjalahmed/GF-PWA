import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { logger } from "../../core/logging/logger.ts";
import type {
  AuditRepository,
  AuditWriteInput,
} from "./audit.repository.interface.ts";

export class SupabaseAuditRepository implements AuditRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  async write(params: AuditWriteInput): Promise<void> {
    const { error } = await this.adminClient.rpc("write_audit_log", {
      p_actor_user_id: params.actorUserId,
      p_action: params.action,
      p_entity_type: params.entityType,
      p_entity_id: params.entityId ?? null,
      p_previous_status: params.previousStatus ?? null,
      p_new_status: params.newStatus ?? null,
      p_reason: params.reason ?? null,
      p_request_id: params.requestId ?? null,
      p_old_values: params.oldValues ?? null,
      p_new_values: params.newValues ?? null,
      p_metadata: params.metadata ?? {},
    });

    if (error) {
      logger.error({ message: "audit write failed", error: error.message });
    }
  }
}
