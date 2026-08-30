import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../../core/types/context.ts";
import { requireAuthentication } from "../../core/auth/authentication.middleware.ts";
import {
  requireActiveBusiness,
  requireBusinessMembership,
  requireBusinessPermission,
} from "../../core/auth/business-authorization.middleware.ts";
import { validate } from "../../core/validation/validation.middleware.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import { ApiContract } from "../../contracts/api-contract.ts";
import {
  businessIdParamsSchema,
  createProductImageSchema,
  createProductSchema,
  listProductsQuerySchema,
  productImageParamsSchema,
  productParamsSchema,
  replaceProductCompatibilitySchema,
  updateProductSchema,
} from "./product.schemas.ts";
import {
  createProductController,
  createProductImageController,
  deactivateProductController,
  deleteProductImageController,
  getProductCompatibilityController,
  getProductController,
  listProductsController,
  replaceProductCompatibilityController,
  updateProductController,
} from "./product.controller.ts";

export const productRoutes = new Hono<{ Variables: AppVariables }>();

productRoutes.get(
  ApiContract.routes.businessProducts,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Product.Read),
  validate({ params: businessIdParamsSchema, query: listProductsQuerySchema }),
  (c) => listProductsController(c),
);

productRoutes.post(
  ApiContract.routes.businessProducts,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Product.Create),
  validate({ params: businessIdParamsSchema, body: createProductSchema }),
  (c) => createProductController(c),
);

productRoutes.get(
  ApiContract.routes.businessProductById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Product.Read),
  validate({ params: productParamsSchema }),
  (c) => getProductController(c),
);

productRoutes.patch(
  ApiContract.routes.businessProductById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Product.Update),
  validate({ params: productParamsSchema, body: updateProductSchema }),
  (c) => updateProductController(c),
);

productRoutes.delete(
  ApiContract.routes.businessProductById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Product.Deactivate),
  validate({ params: productParamsSchema }),
  (c) => deactivateProductController(c),
);

productRoutes.post(
  ApiContract.routes.businessProductImages,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Product.ImageManage),
  validate({ params: productParamsSchema, body: createProductImageSchema }),
  (c) => createProductImageController(c),
);

productRoutes.delete(
  ApiContract.routes.businessProductImageById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Product.ImageManage),
  validate({ params: productImageParamsSchema }),
  (c) => deleteProductImageController(c),
);

productRoutes.get(
  ApiContract.routes.businessProductCompatibility,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Product.Read),
  validate({ params: productParamsSchema }),
  (c) => getProductCompatibilityController(c),
);

productRoutes.put(
  ApiContract.routes.businessProductCompatibility,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Product.Update),
  validate({
    params: productParamsSchema,
    body: replaceProductCompatibilitySchema,
  }),
  (c) => replaceProductCompatibilityController(c),
);
