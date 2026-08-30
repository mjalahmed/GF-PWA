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
  createServiceImageSchema,
  createServiceSchema,
  listServicesQuerySchema,
  replaceServiceCompatibilitySchema,
  serviceImageParamsSchema,
  serviceParamsSchema,
  updateServiceSchema,
} from "./service.schemas.ts";
import {
  createServiceController,
  createServiceImageController,
  deactivateServiceController,
  deleteServiceImageController,
  getServiceCompatibilityController,
  getServiceController,
  listServicesController,
  replaceServiceCompatibilityController,
  updateServiceController,
} from "./service.controller.ts";

export const serviceRoutes = new Hono<{ Variables: AppVariables }>();

serviceRoutes.get(
  ApiContract.routes.businessServices,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Service.Read),
  validate({ params: businessIdParamsSchema, query: listServicesQuerySchema }),
  (c) => listServicesController(c),
);

serviceRoutes.post(
  ApiContract.routes.businessServices,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Service.Create),
  validate({ params: businessIdParamsSchema, body: createServiceSchema }),
  (c) => createServiceController(c),
);

serviceRoutes.get(
  ApiContract.routes.businessServiceById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Service.Read),
  validate({ params: serviceParamsSchema }),
  (c) => getServiceController(c),
);

serviceRoutes.patch(
  ApiContract.routes.businessServiceById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Service.Update),
  validate({ params: serviceParamsSchema, body: updateServiceSchema }),
  (c) => updateServiceController(c),
);

serviceRoutes.delete(
  ApiContract.routes.businessServiceById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Service.Deactivate),
  validate({ params: serviceParamsSchema }),
  (c) => deactivateServiceController(c),
);

serviceRoutes.post(
  ApiContract.routes.businessServiceImages,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Service.ImageManage),
  validate({ params: serviceParamsSchema, body: createServiceImageSchema }),
  (c) => createServiceImageController(c),
);

serviceRoutes.delete(
  ApiContract.routes.businessServiceImageById,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Service.ImageManage),
  validate({ params: serviceImageParamsSchema }),
  (c) => deleteServiceImageController(c),
);

serviceRoutes.get(
  ApiContract.routes.businessServiceCompatibility,
  requireAuthentication(),
  requireBusinessMembership(),
  requireBusinessPermission(Permissions.Business.Service.Read),
  validate({ params: serviceParamsSchema }),
  (c) => getServiceCompatibilityController(c),
);

serviceRoutes.put(
  ApiContract.routes.businessServiceCompatibility,
  requireAuthentication(),
  requireBusinessMembership(),
  requireActiveBusiness(),
  requireBusinessPermission(Permissions.Business.Service.Update),
  validate({
    params: serviceParamsSchema,
    body: replaceServiceCompatibilitySchema,
  }),
  (c) => replaceServiceCompatibilityController(c),
);
