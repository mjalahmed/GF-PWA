import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError } from "../../core/errors/app-error.ts";
import { logger } from "../../core/logging/logger.ts";
import { resolveAuditScope, sanitizeAuditValue } from "./audit.scope.ts";
import type {
  AuditRepository,
  AuditWriteInput,
  BusinessAuditLogRecord,
  BusinessAuditQuery,
} from "./audit.repository.interface.ts";

type AuditRow = {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  business_id: string;
  branch_id: string | null;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const AUDIT_SELECT =
  "id, actor_user_id, actor_role, action, entity_type, entity_id, business_id, branch_id, previous_status, new_status, reason, old_values, new_values, metadata, created_at";

export class SupabaseAuditRepository implements AuditRepository {
  constructor(private readonly adminClient: SupabaseClient) {}

  async write(params: AuditWriteInput): Promise<void> {
    const scope = resolveAuditScope(params);
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
      p_business_id: scope.businessId,
      p_branch_id: scope.branchId,
      p_actor_role: params.actorRole ?? null,
    });

    if (error) {
      logger.error({ message: "audit write failed", error: error.message });
    }
  }

  async listForBusiness(
    query: BusinessAuditQuery,
  ): Promise<{ items: BusinessAuditLogRecord[]; total: number }> {
    let request = this.adminClient
      .from("audit_logs")
      .select(AUDIT_SELECT, { count: "exact" })
      .eq("business_id", query.businessId)
      .order("created_at", { ascending: false });

    if (query.actorUserId) request = request.eq("actor_user_id", query.actorUserId);
    if (query.action) request = request.eq("action", query.action);
    if (query.entityType) request = request.eq("entity_type", query.entityType);
    if (query.entityId) request = request.eq("entity_id", query.entityId);
    if (query.branchId) request = request.eq("branch_id", query.branchId);
    if (query.from) request = request.gte("created_at", query.from);
    if (query.to) request = request.lte("created_at", query.to);

    const start = (query.page - 1) * query.pageSize;
    const { data, error, count } = await request.range(
      start,
      start + query.pageSize - 1,
    );
    if (error) throw new InternalError("Failed to load business audit logs.", error);

    const rows = (data ?? []) as AuditRow[];
    const actorIds = [...new Set(rows.map((row) => row.actor_user_id).filter(Boolean))] as string[];
    const names = new Map<string, string | null>();
    if (actorIds.length > 0) {
      const { data: profiles, error: profileError } = await this.adminClient
        .from("profiles")
        .select("id, full_name")
        .in("id", actorIds);
      if (profileError) {
        throw new InternalError("Failed to load audit actors.", profileError);
      }
      for (const profile of (profiles ?? []) as { id: string; full_name: string | null }[]) {
        names.set(profile.id, profile.full_name);
      }
    }

    return {
      total: count ?? rows.length,
      items: rows.map((row) => ({
        id: row.id,
        actorUserId: row.actor_user_id,
        actorName: row.actor_user_id ? names.get(row.actor_user_id) ?? null : null,
        actorRole: row.actor_role,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        businessId: row.business_id,
        branchId: row.branch_id,
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        reason: row.reason,
        oldValues: sanitizeAuditValue(row.old_values) as Record<string, unknown> | null,
        newValues: sanitizeAuditValue(row.new_values) as Record<string, unknown> | null,
        metadata: (sanitizeAuditValue(row.metadata ?? {}) ?? {}) as Record<string, unknown>,
        createdAt: row.created_at,
      })),
    };
  }
}
