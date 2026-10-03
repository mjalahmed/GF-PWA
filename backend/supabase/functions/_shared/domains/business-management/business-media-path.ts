import { ValidationError } from "../../core/errors/app-error.ts";

const MEDIA_KINDS = new Set(["logo", "cover", "gallery"]);

/** Branding paths must be `{businessId}/{logo|cover|gallery}/...` for this business. */
export function assertOwnedBusinessMediaPath(
  businessId: string,
  path: string | null | undefined,
): void {
  if (path == null || path === "") return;
  if (path.includes("..") || path.includes("\\") || path.startsWith("/")) {
    throw new ValidationError("Media path must belong to this business.");
  }
  const parts = path.split("/").filter((part) => part.length > 0);
  if (parts.length < 3 || parts[0] !== businessId || !MEDIA_KINDS.has(parts[1] ?? "")) {
    throw new ValidationError("Media path must belong to this business.");
  }
}
