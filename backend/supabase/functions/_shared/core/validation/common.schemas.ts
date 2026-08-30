import { z } from "npm:zod@3.24.1";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
