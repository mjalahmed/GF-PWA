import { z } from "npm:zod@3.24.1";

export function parsePagination(query: Record<string, string | undefined>) {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export const uuidSchema = z.string().uuid();

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180);
}
