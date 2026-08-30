import { Hono } from "npm:hono@4.6.14";
import { z } from "npm:zod@3.24.1";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { ApiContract } from "../../contracts/api-contract.ts";
import {
  discoveryCatalogQuerySchema,
  discoverySearchQuerySchema,
  discoverySlugParamsSchema,
  favoriteBusinessParamsSchema,
} from "./discovery.schemas.ts";
import {
  addFavoriteController,
  getDiscoveryBusinessController,
  listDiscoveryProductsController,
  listDiscoveryServicesController,
  listFavoritesController,
  removeFavoriteController,
  searchBusinessesController,
} from "./discovery.controller.ts";

export const discoveryRoutes = new Hono<{ Variables: AppVariables }>();

const geoQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
}).strict();

const emptyBodySchema = z.object({}).strict();

discoveryRoutes.get(
  ApiContract.routes.discoveryBusinesses,
  validate({ query: discoverySearchQuerySchema }),
  (c) => searchBusinessesController(c),
);

discoveryRoutes.get(
  ApiContract.routes.discoveryBusinessBySlug,
  validate({ params: discoverySlugParamsSchema, query: geoQuerySchema }),
  (c) => getDiscoveryBusinessController(c),
);

discoveryRoutes.get(
  ApiContract.routes.discoveryBusinessServices,
  validate({
    params: discoverySlugParamsSchema,
    query: discoveryCatalogQuerySchema,
  }),
  (c) => listDiscoveryServicesController(c),
);

discoveryRoutes.get(
  ApiContract.routes.discoveryBusinessProducts,
  validate({
    params: discoverySlugParamsSchema,
    query: discoveryCatalogQuerySchema,
  }),
  (c) => listDiscoveryProductsController(c),
);

discoveryRoutes.get(
  ApiContract.routes.favorites,
  requireAuthentication(),
  (c) => listFavoritesController(c),
);

discoveryRoutes.post(
  ApiContract.routes.favoriteByBusinessId,
  requireAuthentication(),
  validate({ params: favoriteBusinessParamsSchema, body: emptyBodySchema }),
  (c) => addFavoriteController(c),
);

discoveryRoutes.delete(
  ApiContract.routes.favoriteByBusinessId,
  requireAuthentication(),
  validate({ params: favoriteBusinessParamsSchema }),
  (c) => removeFavoriteController(c),
);
