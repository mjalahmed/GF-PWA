import { z } from "npm:zod@3.24.1";
import { businessIdParamsSchema } from "./business.schemas.ts";

const uuidSchema = z.string().uuid();

export const membershipParamsSchema = businessIdParamsSchema.extend({
  membershipId: uuidSchema,
}).strict();
const emailSchema = z.string().trim().email();

const membershipRoleSchema = z.enum([
  "owner",
  "manager",
  "service_advisor",
  "mechanic",
  "cashier",
  "receptionist",
  "staff",
]);

export const updateMembershipRoleSchema = z.object({
  role: membershipRoleSchema,
}).strict();

export type UpdateMembershipRoleRequestDto = z.infer<
  typeof updateMembershipRoleSchema
>;
export type MembershipParamsDto = z.infer<typeof membershipParamsSchema>;
