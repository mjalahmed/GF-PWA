import { z } from "npm:zod@3.24.1";

export const healthResponseSchema = z.object({
  service: z.literal("garagefinder-api"),
  status: z.enum(["ok", "ready"]),
  version: z.literal("v1"),
});
