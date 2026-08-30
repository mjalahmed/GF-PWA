import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type {
  DiscoveryCatalogQueryDto,
  DiscoverySearchQueryDto,
  DiscoverySlugParamsDto,
  FavoriteBusinessParamsDto,
} from "./discovery.schemas.ts";

export async function searchBusinessesController(c: AppContext) {
  const query = (c.get("validatedQuery" as never) ?? {}) as DiscoverySearchQueryDto;
  const { discoveryService } = createRequestDependencies(c);
  const result = await discoveryService.searchBusinesses(
    query,
    c.get("userId") ?? undefined,
  );
  return successResponse(c, result.items, 200, result.pagination);
}

export async function getDiscoveryBusinessController(c: AppContext) {
  const { slug } = (c.get("validatedParams" as never) ??
    {}) as DiscoverySlugParamsDto;
  const query = (c.get("validatedQuery" as never) ?? {}) as {
    latitude?: number;
    longitude?: number;
  };
  const { discoveryService } = createRequestDependencies(c);
  const business = await discoveryService.getBusinessBySlug(
    slug,
    query.latitude,
    query.longitude,
  );
  return successResponse(c, business);
}

export async function listDiscoveryServicesController(c: AppContext) {
  const { slug } = (c.get("validatedParams" as never) ??
    {}) as DiscoverySlugParamsDto;
  const query = (c.get("validatedQuery" as never) ?? {}) as DiscoveryCatalogQueryDto;
  const { discoveryService } = createRequestDependencies(c);
  const result = await discoveryService.listPublicServices(
    slug,
    query,
    c.get("userId") ?? undefined,
  );
  return successResponse(c, result.items, 200, result.pagination);
}

export async function listDiscoveryProductsController(c: AppContext) {
  const { slug } = (c.get("validatedParams" as never) ??
    {}) as DiscoverySlugParamsDto;
  const query = (c.get("validatedQuery" as never) ?? {}) as DiscoveryCatalogQueryDto;
  const { discoveryService } = createRequestDependencies(c);
  const result = await discoveryService.listPublicProducts(
    slug,
    query,
    c.get("userId") ?? undefined,
  );
  return successResponse(c, result.items, 200, result.pagination);
}

export async function listFavoritesController(c: AppContext) {
  const customerId = c.get("userId")!;
  const { discoveryService } = createRequestDependencies(c);
  const favorites = await discoveryService.listFavorites(customerId);
  return successResponse(c, favorites);
}

export async function addFavoriteController(c: AppContext) {
  const customerId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as FavoriteBusinessParamsDto;
  const { discoveryService } = createRequestDependencies(c);
  const favorite = await discoveryService.addFavorite(customerId, businessId);
  return successResponse(c, favorite, 201);
}

export async function removeFavoriteController(c: AppContext) {
  const customerId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as FavoriteBusinessParamsDto;
  const { discoveryService } = createRequestDependencies(c);
  await discoveryService.removeFavorite(customerId, businessId);
  return successResponse(c, { businessId });
}
