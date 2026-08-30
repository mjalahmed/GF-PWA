import { z } from "npm:zod@3.24.1";
import { businessIdParamsSchema, invitationTokenParamsSchema } from "./business.schemas.ts";

const uuidSchema = z.string().uuid();
const emailSchema = z.string().trim().email();

export { invitationTokenParamsSchema };

export const invitationParamsSchema = businessIdParamsSchema.extend({
  invitationId: uuidSchema,
}).strict();

const invitableRoleSchema = z.enum([
  "manager",
  "service_advisor",
  "mechanic",
  "cashier",
  "receptionist",
  "staff",
]);

export const createInvitationSchema = z.object({
  email: emailSchema,
  role: invitableRoleSchema,
  expiresInDays: z.number().int().min(1).max(30).optional(),
}).strict();

export const acceptInvitationSchema = z.object({}).strict();

export type CreateInvitationRequestDto = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationRequestDto = z.infer<typeof acceptInvitationSchema>;
export type InvitationTokenParamsDto = z.infer<typeof invitationTokenParamsSchema>;
export type InvitationParamsDto = z.infer<typeof invitationParamsSchema>;
