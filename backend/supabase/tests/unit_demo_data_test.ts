/**
 * Phase 5 demo fixture and safety unit tests (no network).
 */
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DemoIds,
  isDemoUuid,
  serviceId,
  productId,
  DEMO_SLUGS,
} from "../demo/ids.ts";
import {
  assertDemoPassword,
  assertSafeDemoTarget,
  isLocalSupabaseUrl,
  isBlockedProductionUrl,
} from "../demo/env.ts";
import {
  DEMO_BUSINESSES,
  validateBusinessFixtures,
} from "../demo/businesses.ts";
import {
  DEMO_SERVICES,
  validateServiceFixtures,
} from "../demo/services.ts";
import {
  DEMO_PRODUCTS,
  validateProductFixtures,
} from "../demo/products.ts";
import {
  DEMO_VEHICLES,
  DEMO_FAVORITES,
  validateVehicleFixtures,
  validateFavoriteFixtures,
} from "../demo/vehicles.ts";
import { DEMO_ACCOUNTS, emptyUserMap } from "../demo/accounts.ts";
import { scheduleForKind } from "../demo/schedules.ts";

Deno.test("demo IDs are stable and namespaced", () => {
  assertEquals(isDemoUuid(DemoIds.businesses.pearlMotorWorks), true);
  assertEquals(serviceId(1), "d5e00000-0000-4000-8000-000000001001");
  assertEquals(productId(2), "d5e00000-0000-4000-8000-000000002002");
  assertEquals(DEMO_SLUGS.length, 6);
});

Deno.test("business fixtures validate", () => {
  validateBusinessFixtures(DEMO_BUSINESSES);
  assertEquals(DEMO_BUSINESSES.length, 6);
});

Deno.test("service fixtures validate pricing and count", () => {
  validateServiceFixtures(DEMO_SERVICES);
  assertEquals(DEMO_SERVICES.length >= 30, true);
});

Deno.test("product fixtures validate inventory statuses", () => {
  validateProductFixtures(DEMO_PRODUCTS);
  assertEquals(DEMO_PRODUCTS.length >= 24, true);
});

Deno.test("vehicle and favorite fixtures validate", () => {
  validateVehicleFixtures(DEMO_VEHICLES);
  validateFavoriteFixtures(DEMO_FAVORITES);
  assertEquals(DEMO_VEHICLES.length, 10);
  assertEquals(DEMO_FAVORITES.length, 8);
});

Deno.test("duplicate business slug detection", () => {
  assertThrows(() => {
    validateBusinessFixtures([
      DEMO_BUSINESSES[0],
      { ...DEMO_BUSINESSES[1], slug: DEMO_BUSINESSES[0].slug },
    ]);
  });
});

Deno.test("environment safety guards", () => {
  assertEquals(isLocalSupabaseUrl("http://127.0.0.1:54321"), true);
  assertEquals(isBlockedProductionUrl("https://xyz.supabase.co"), true);
  assertThrows(() =>
    assertSafeDemoTarget({
      supabaseUrl: "https://xyz.supabase.co",
      allowDemoSeed: false,
      appEnv: "development",
    })
  );
  // Staging hosted demo allowed only with explicit override.
  assertSafeDemoTarget({
    supabaseUrl: "https://xyz.supabase.co",
    allowDemoSeed: true,
    appEnv: "staging",
  });
  // Production is always blocked, even with ALLOW_DEMO_SEED.
  assertThrows(() =>
    assertSafeDemoTarget({
      supabaseUrl: "https://xyz.supabase.co",
      allowDemoSeed: true,
      appEnv: "production",
    })
  );
  assertThrows(() =>
    assertSafeDemoTarget({
      supabaseUrl: "https://project.example.dev",
      allowDemoSeed: false,
      appEnv: "development",
    })
  );
  assertEquals(assertDemoPassword("GarageFinderDemo123!").length >= 12, true);
  assertThrows(() => assertDemoPassword("short"));
});

Deno.test("user map has all account keys", () => {
  const map = emptyUserMap();
  assertEquals(Object.keys(map).length, DEMO_ACCOUNTS.length);
  assertEquals(DEMO_ACCOUNTS.some((a) => a.email === "outsider@garagefinder.test"), true);
});

Deno.test("schedules produce 7 days", () => {
  for (const kind of ["garage", "detailing", "tire", "parts"] as const) {
    const hours = scheduleForKind(kind);
    assertEquals(hours.length, 7);
    assertEquals(new Set(hours.map((h) => h.dayOfWeek)).size, 7);
  }
});
