import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";

export class ServiceNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Service was not found.", id ? { serviceId: id } : null);
    this.name = "ServiceNotFoundError";
  }
}

export class ProductNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Product was not found.", id ? { productId: id } : null);
    this.name = "ProductNotFoundError";
  }
}

export class CatalogImageNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Catalog image was not found.", id ? { imageId: id } : null);
    this.name = "CatalogImageNotFoundError";
  }
}

export class CategoryNotFoundError extends NotFoundError {
  constructor(id?: string) {
    super("Category was not found.", id ? { categoryId: id } : null);
    this.name = "CategoryNotFoundError";
  }
}

export class InventoryNotFoundError extends NotFoundError {
  constructor(message = "Inventory record was not found.") {
    super(message);
    this.name = "InventoryNotFoundError";
  }
}

export class BranchBusinessMismatchError extends ValidationError {
  constructor() {
    super("Branch does not belong to this business.");
    this.name = "BranchBusinessMismatchError";
  }
}

export class CatalogOperationError extends ConflictError {
  constructor(message: string, details?: unknown) {
    super(ErrorCodes.Resource.Conflict, message, details ?? null);
    this.name = "CatalogOperationError";
  }
}

export function mapCatalogRpcError(message: string): never {
  if (message.includes("PRODUCT_NOT_FOUND")) {
    throw new ProductNotFoundError();
  }
  if (message.includes("BRANCH_BUSINESS_MISMATCH")) {
    throw new BranchBusinessMismatchError();
  }
  if (message.includes("INSUFFICIENT_STOCK")) {
    throw new CatalogOperationError("Insufficient stock for this adjustment.");
  }
  if (message.includes("RESERVED_EXCEEDS_ON_HAND")) {
    throw new CatalogOperationError(
      "Reserved quantity would exceed on-hand quantity.",
    );
  }
  if (message.includes("UNSUPPORTED_ADJUSTMENT_TYPE")) {
    throw new ValidationError("Unsupported inventory adjustment type.");
  }
  if (message.includes("ZERO_DELTA") || message.includes("INVALID_DELTA")) {
    throw new ValidationError("Invalid inventory quantity delta.");
  }
  if (message.includes("PERMISSION_DENIED")) {
    throw new AuthorizationError("You do not have permission for this action.");
  }
  throw new ConflictError(ErrorCodes.Resource.Conflict, message);
}

export function buildCatalogImageStoragePath(
  businessId: string,
  itemId: string,
  imageId: string,
  originalFileName: string,
): string {
  const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${businessId}/${itemId}/${imageId}/${safeName}`;
}
