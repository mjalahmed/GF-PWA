import { z } from "npm:zod@3.24.1";
import { ValidationError } from "../../core/errors/app-error.ts";
import {
  ServicePricingTypes,
  type ServicePricingType,
} from "../../core/constants/statuses.ts";

export function validateServicePricing(input: {
  pricingType: ServicePricingType;
  price?: number | null;
  minimumPrice?: number | null;
  maximumPrice?: number | null;
}): void {
  const { pricingType, price, minimumPrice, maximumPrice } = input;

  if (pricingType === ServicePricingTypes.Fixed) {
    if (price == null || price < 0) {
      throw new ValidationError("Fixed pricing requires a non-negative price.");
    }
  } else if (pricingType === ServicePricingTypes.StartingFrom) {
    if (minimumPrice == null || minimumPrice < 0) {
      throw new ValidationError(
        "Starting-from pricing requires a non-negative minimum price.",
      );
    }
  } else if (pricingType === ServicePricingTypes.Range) {
    if (minimumPrice == null || maximumPrice == null) {
      throw new ValidationError("Range pricing requires minimum and maximum prices.");
    }
    if (minimumPrice < 0 || maximumPrice < 0) {
      throw new ValidationError("Range prices cannot be negative.");
    }
    if (minimumPrice > maximumPrice) {
      throw new ValidationError("Minimum price cannot exceed maximum price.");
    }
  } else if (pricingType === ServicePricingTypes.Free) {
    if (price != null && price !== 0) {
      throw new ValidationError("Free pricing must resolve to zero.");
    }
  }
}

export function validateProductPricing(input: {
  price: number;
  salePrice?: number | null;
}): void {
  if (input.price < 0) {
    throw new ValidationError("Price cannot be negative.");
  }
  if (input.salePrice != null) {
    if (input.salePrice < 0) {
      throw new ValidationError("Sale price cannot be negative.");
    }
    if (input.salePrice > input.price) {
      throw new ValidationError("Sale price cannot exceed regular price.");
    }
  }
}

export const servicePricingTypeSchema = z.enum([
  ServicePricingTypes.Fixed,
  ServicePricingTypes.StartingFrom,
  ServicePricingTypes.Range,
  ServicePricingTypes.QuoteRequired,
  ServicePricingTypes.Free,
]);
