import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { openApiDocument } from "../../functions/_shared/contracts/openapi.ts";
import { ErrorCodes } from "../../functions/_shared/core/constants/error-codes.ts";

Deno.test("contract: health schema matches runtime sample", () => {
  const sample = {
    success: true,
    data: { service: "garagefinder-api", status: "ok", version: "v1" },
    error: null,
    meta: { requestId: "00000000-0000-4000-8000-000000000001" },
  };
  const healthSchema = openApiDocument.components.schemas.Health;
  assertEquals(healthSchema.properties.service.const, sample.data.service);
  assertEquals(healthSchema.properties.status.const, sample.data.status);
});

Deno.test("contract: profile schema uses camelCase fields", () => {
  const props = openApiDocument.components.schemas.Profile.properties;
  assertEquals("fullName" in props, true);
  assertEquals("full_name" in props, false);
});

Deno.test("contract: documented auth error codes exist", () => {
  const codes = openApiDocument.components.schemas.ApiError.properties.code.enum;
  assertEquals(codes.includes(ErrorCodes.Authentication.HeaderMissing), true);
  assertEquals(codes.includes(ErrorCodes.Validation.InvalidRequest), true);
  assertEquals(codes.includes(ErrorCodes.Internal.Unexpected), true);
});

Deno.test("contract: OpenAPI JSON serializes", () => {
  const json = JSON.stringify(openApiDocument);
  const parsed = JSON.parse(json);
  assertEquals(parsed.openapi, "3.1.0");
});
