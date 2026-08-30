/** Strip sensitive fields from objects before logging. */
const REDACT_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "apikey",
  "secret",
  "service_role",
  "card_number",
  "cvv",
  "cvc",
]);

export function sanitizeForLog(value: unknown): unknown {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeForLog);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = sanitizeForLog(v);
    }
  }
  return out;
}
