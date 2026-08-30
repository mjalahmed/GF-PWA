import { z } from "npm:zod@3.24.1";

export const makeIdParamsSchema = z.object({
  makeId: z.string().uuid(),
}).strict();

export type MakeIdParamsDto = z.infer<typeof makeIdParamsSchema>;
