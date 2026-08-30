/**
 * Phase 4 catalog / vehicles / discovery unit tests.
 */
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ApiContract } from "../functions/_shared/contracts/api-contract.ts";
import { Permissions } from "../functions/_shared/core/constants/permissions.ts";
import { slugify } from "../functions/_shared/core/utils/slugify.ts";
import {
  ServicePricingTypes,
  ProductStockStatuses,
  CompatibilityTypes,
} from "../functions/_shared/core/constants/statuses.ts";
import {
  validateServicePricing,
  validateProductPricing,
} from "../functions/_shared/domains/catalog/catalog.validation.ts";
import { createVehicleSchema } from "../functions/_shared/domains/vehicles/vehicle.schemas.ts";
import { discoverySearchQuerySchema } from "../functions/_shared/domains/discovery/discovery.schemas.ts";
import {
  haversineDistanceKm,
  normalizeSearchQuery,
  evaluateOpenNow,
} from "../functions/_shared/domains/discovery/discovery.utils.ts";
import { DiscoveryMapper } from "../functions/_shared/domains/discovery/discovery.mapper.ts";
import { ValidationError } from "../functions/_shared/core/errors/app-error.ts";
import { adjustInventorySchema } from "../functions/_shared/domains/catalog/inventory.schemas.ts";
import { ServiceService } from "../functions/_shared/domains/catalog/service.service.ts";

Deno.test("ApiContract exposes Phase 4 catalog and discovery routes", () => {
  assertEquals(
    ApiContract.routes.businessServices,
    "/businesses/:businessId/services",
  );
  assertEquals(
    ApiContract.routes.businessProducts,
    "/businesses/:businessId/products",
  );
  assertEquals(ApiContract.routes.vehicles, "/vehicles");
  assertEquals(
    ApiContract.routes.discoveryBusinesses,
    "/discovery/businesses",
  );
  assertEquals(ApiContract.routes.favorites, "/favorites");
});

Deno.test("slugify normalizes names", () => {
  assertEquals(slugify("Oil Change Pro!"), "oil-change-pro");
  assertEquals(slugify("  BMW  X5  "), "bmw-x5");
});

Deno.test("Phase 4 permission codes exist", () => {
  assertEquals(Permissions.Business.Service.Create, "business.service.create");
  assertEquals(Permissions.Business.Product.Update, "business.product.update");
  assertEquals(Permissions.Business.Inventory.Adjust, "business.inventory.adjust");
  assertEquals(Permissions.Vehicle.Create, "vehicle.create");
  assertEquals(Permissions.Discovery.BusinessRead, "discovery.business.read");
});

Deno.test("pricing and stock status registries", () => {
  assertEquals(ServicePricingTypes.Fixed, "fixed");
  assertEquals(ServicePricingTypes.QuoteRequired, "quote_required");
  assertEquals(ProductStockStatuses.InStock, "in_stock");
  assertEquals(ProductStockStatuses.OutOfStock, "out_of_stock");
});

Deno.test("validateServicePricing enforces pricing rules", () => {
  validateServicePricing({ pricingType: ServicePricingTypes.Fixed, price: 10 });
  assertThrows(
    () => validateServicePricing({ pricingType: ServicePricingTypes.Fixed }),
    ValidationError,
  );
  validateServicePricing({
    pricingType: ServicePricingTypes.StartingFrom,
    minimumPrice: 5,
  });
  assertThrows(
    () =>
      validateServicePricing({
        pricingType: ServicePricingTypes.Range,
        minimumPrice: 20,
        maximumPrice: 10,
      }),
    ValidationError,
  );
  validateServicePricing({ pricingType: ServicePricingTypes.QuoteRequired });
  validateServicePricing({ pricingType: ServicePricingTypes.Free, price: 0 });
  assertThrows(
    () =>
      validateServicePricing({
        pricingType: ServicePricingTypes.Free,
        price: 1,
      }),
    ValidationError,
  );
});

Deno.test("validateProductPricing enforces sale rules", () => {
  validateProductPricing({ price: 10, salePrice: 8 });
  assertThrows(
    () => validateProductPricing({ price: -1 }),
    ValidationError,
  );
  assertThrows(
    () => validateProductPricing({ price: 10, salePrice: 12 }),
    ValidationError,
  );
});

Deno.test("createVehicleSchema validates year and make", () => {
  const ok = createVehicleSchema.safeParse({
    makeText: "Toyota",
    year: 2020,
    mileage: 1000,
  });
  assertEquals(ok.success, true);

  const badYear = createVehicleSchema.safeParse({
    makeText: "Toyota",
    year: 1900,
  });
  assertEquals(badYear.success, false);

  const badMileage = createVehicleSchema.safeParse({
    makeText: "Toyota",
    year: 2020,
    mileage: -1,
  });
  assertEquals(badMileage.success, false);

  const noMake = createVehicleSchema.safeParse({ year: 2020 });
  assertEquals(noMake.success, false);
});

Deno.test("adjustInventorySchema requires positive delta for manual add", () => {
  const ok = adjustInventorySchema.safeParse({
    branchId: "11111111-1111-1111-1111-111111111111",
    adjustmentType: "manual_add",
    quantityDelta: 5,
  });
  assertEquals(ok.success, true);

  const bad = adjustInventorySchema.safeParse({
    branchId: "11111111-1111-1111-1111-111111111111",
    adjustmentType: "manual_add",
    quantityDelta: 0,
  });
  assertEquals(bad.success, false);
});

Deno.test("normalizeSearchQuery strips wildcards", () => {
  assertEquals(normalizeSearchQuery("  Oil%_Change  "), "oilchange");
  assertEquals(normalizeSearchQuery("   "), undefined);
});

Deno.test("discoverySearchQuerySchema parses pagination and filters", () => {
  const parsed = discoverySearchQuerySchema.parse({
    query: "oil",
    page: "2",
    pageSize: "10",
    openNow: "true",
    vehicleYear: "2020",
    sort: "relevance",
  });
  assertEquals(parsed.page, 2);
  assertEquals(parsed.pageSize, 10);
  assertEquals(parsed.openNow, true);
  assertEquals(parsed.vehicleYear, 2020);
});

Deno.test("haversineDistanceKm approximates Manama to Muharraq", () => {
  // Rough coordinates; expect a short distance under ~20km.
  const km = haversineDistanceKm(26.2285, 50.5860, 26.2572, 50.6119);
  assertEquals(km > 0 && km < 20, true);
});

Deno.test("evaluateOpenNow respects hours and closures", () => {
  const branch = {
    id: "b1",
    name: "Main",
    isActive: true,
    isPrimary: true,
  };
  // Force a closed result via full-day closure for today in Bahrain.
  const closed = evaluateOpenNow({
    branches: [branch],
    openingHours: [{
      branchId: "b1",
      dayOfWeek: 0,
      opensAt: "00:00",
      closesAt: "23:59",
      isClosed: false,
    }, {
      branchId: "b1",
      dayOfWeek: 1,
      opensAt: "00:00",
      closesAt: "23:59",
      isClosed: false,
    }, {
      branchId: "b1",
      dayOfWeek: 2,
      opensAt: "00:00",
      closesAt: "23:59",
      isClosed: false,
    }, {
      branchId: "b1",
      dayOfWeek: 3,
      opensAt: "00:00",
      closesAt: "23:59",
      isClosed: false,
    }, {
      branchId: "b1",
      dayOfWeek: 4,
      opensAt: "00:00",
      closesAt: "23:59",
      isClosed: false,
    }, {
      branchId: "b1",
      dayOfWeek: 5,
      opensAt: "00:00",
      closesAt: "23:59",
      isClosed: false,
    }, {
      branchId: "b1",
      dayOfWeek: 6,
      opensAt: "00:00",
      closesAt: "23:59",
      isClosed: false,
    }],
    closureDates: [{
      branchId: "b1",
      closureDate: new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bahrain",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
      isFullDay: true,
      opensAt: null,
      closesAt: null,
    }],
  });
  assertEquals(closed.isOpen, false);
});

Deno.test("ServiceService compatibility validation rejects bad combinations", () => {
  const service = new ServiceService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const validate = (service as unknown as {
    validateCompatibilityItems: (items: unknown[]) => unknown;
  }).validateCompatibilityItems.bind(service);

  assertThrows(
    () =>
      validate([{
        compatibilityType: CompatibilityTypes.Make,
        makeId: null,
      }]),
    ValidationError,
  );

  const ok = validate([{
    compatibilityType: CompatibilityTypes.AllVehicles,
  }]);
  assertEquals((ok as { compatibilityType: string }[]).length, 1);
});

Deno.test("DiscoveryMapper public summary omits internal inventory fields", () => {
  const dto = DiscoveryMapper.toSummaryDto({
    business: {
      id: "11111111-1111-1111-1111-111111111111",
      slug: "demo",
      displayName: "Demo Garage",
      description: "desc",
      logoPath: null,
      coverPath: null,
      businessCategoryId: null,
      verificationStatus: "verified",
      averageRating: 0,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
      branches: [],
      serviceCount: 1,
      productCount: 2,
    },
    openingState: { isOpen: false, branchId: null, branchName: null },
    distanceKm: 1.5,
  });
  assertEquals(dto.slug, "demo");
  assertEquals(dto.distanceKm, 1.5);
  assertEquals("quantityReserved" in dto, false);
  assertEquals("metadata" in dto, false);
});
