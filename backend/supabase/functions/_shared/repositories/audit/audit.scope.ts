import type { AuditWriteInput } from "./audit.repository.interface.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SENSITIVE_KEY = /token|password|secret|authorization|api[_-]?key|internal[_-]?notes?/i;

function readUuid(
  sources: Array<Record<string, unknown> | null | undefined>,
  keys: string[],
): string | null {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && UUID_RE.test(value)) return value;
    }
  }
  return null;
}

export function resolveAuditScope(input: AuditWriteInput): {
  businessId: string | null;
  branchId: string | null;
} {
  const sources = [input.metadata, input.newValues, input.oldValues];
  return {
    businessId: input.businessId ??
      readUuid(sources, ["businessId", "business_id"]),
    branchId: input.branchId ?? readUuid(sources, ["branchId", "branch_id"]),
  };
}

export function sanitizeAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeAuditValue);
  if (!value || typeof value !== "object") return value ?? null;
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) continue;
    out[key] = sanitizeAuditValue(nested);
  }
  return out;
}
