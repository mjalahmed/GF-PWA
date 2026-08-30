import { z } from "npm:zod@3.24.1";

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9\s-]{8,20}$/, "Enter a valid phone number")
      .nullable()
      .optional(),
    avatarPath: z.string().trim().max(500).nullable().optional(),
    preferredLanguage: z.enum(["en", "ar"]).optional(),
  })
  .strict();

export type UpdateProfileRequestDto = z.infer<typeof updateProfileSchema>;
