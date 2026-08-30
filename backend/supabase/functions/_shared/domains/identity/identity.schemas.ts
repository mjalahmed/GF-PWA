import { z } from "npm:zod@3.24.1";

/** Identity routes currently have no body schemas; reserved for future. */
export const identityPlaceholderSchema = z.object({}).strict();
