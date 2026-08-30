export type AuditWriteInput = {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason?: string | null;
  requestId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

export interface AuditRepository {
  write(params: AuditWriteInput): Promise<void>;
}
