export type AuditWriteInput = {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  businessId?: string | null;
  branchId?: string | null;
  actorRole?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  reason?: string | null;
  requestId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

export type BusinessAuditQuery = {
  businessId: string;
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  branchId?: string;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
};

export type BusinessAuditLogRecord = {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  businessId: string;
  branchId: string | null;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export interface AuditRepository {
  write(params: AuditWriteInput): Promise<void>;
  listForBusiness(
    query: BusinessAuditQuery,
  ): Promise<{ items: BusinessAuditLogRecord[]; total: number }>;
}
