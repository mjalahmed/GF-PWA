import { Hono } from "npm:hono@4.6.14";
import type { AppVariables } from "../core/types/context.ts";
import { loadEnvironment } from "../core/config/environment.ts";
import { requestIdMiddleware } from "../core/middleware/request-id.middleware.ts";
import { loggingMiddleware } from "../core/middleware/logging.middleware.ts";
import { handleAppError } from "../core/middleware/error.middleware.ts";
import { corsMiddleware } from "../core/middleware/cors.middleware.ts";
import { contentTypeMiddleware } from "../core/middleware/content-type.middleware.ts";
import { securityHeadersMiddleware } from "../core/middleware/security-headers.middleware.ts";
import { optionalAuthentication } from "../core/auth/authentication.middleware.ts";
import { healthRoutes } from "../domains/health/health.routes.ts";
import { identityRoutes } from "../domains/identity/identity.routes.ts";
import { profileRoutes } from "../domains/profiles/profile.routes.ts";
import { businessApplicationRoutes } from "../domains/business-onboarding/business-application.routes.ts";
import { businessRoutes } from "../domains/business-management/business.routes.ts";
import { categoryRoutes } from "../domains/catalog/category.routes.ts";
import { serviceRoutes } from "../domains/catalog/service.routes.ts";
import { productRoutes } from "../domains/catalog/product.routes.ts";
import { inventoryRoutes } from "../domains/catalog/inventory.routes.ts";
import { vehicleRoutes } from "../domains/vehicles/vehicle.routes.ts";
import { appointmentRoutes } from "../domains/appointments/appointment.routes.ts";
import { quotationRoutes } from "../domains/quotations/quotation.routes.ts";
import { invoiceRoutes } from "../domains/invoices/invoice.routes.ts";
import { reviewRoutes } from "../domains/reviews/review.routes.ts";
import { disputeRoutes } from "../domains/disputes/dispute.routes.ts";
import { discoveryRoutes } from "../domains/discovery/discovery.routes.ts";
import { openApiRoutes } from "../contracts/openapi.routes.ts";
import { ErrorCodes } from "../core/constants/error-codes.ts";
import { ApiContract } from "../contracts/api-contract.ts";

export function createApplication() {
  const env = loadEnvironment();
  const app = new Hono<{ Variables: AppVariables }>().basePath(env.apiRootPath);

  app.onError((err, c) => handleAppError(err, c));

  app.use("*", corsMiddleware(env));
  app.use("*", requestIdMiddleware);
  app.use("*", securityHeadersMiddleware);
  app.use("*", loggingMiddleware);
  app.use("*", contentTypeMiddleware);
  app.use("*", optionalAuthentication(env));

  const v1 = new Hono<{ Variables: AppVariables }>();
  v1.route("/", healthRoutes);
  v1.route("/", identityRoutes);
  v1.route("/", profileRoutes);
  v1.route("/", businessApplicationRoutes);
  v1.route("/", businessRoutes);
  v1.route("/", categoryRoutes);
  v1.route("/", serviceRoutes);
  v1.route("/", productRoutes);
  v1.route("/", inventoryRoutes);
  v1.route("/", vehicleRoutes);
  v1.route("/", appointmentRoutes);
  v1.route("/", quotationRoutes);
  v1.route("/", invoiceRoutes);
  v1.route("/", reviewRoutes);
  v1.route("/", disputeRoutes);
  v1.route("/", discoveryRoutes);
  v1.route("/", openApiRoutes);

  app.route(ApiContract.basePath, v1);

  app.notFound((c) =>
    c.json(
      {
        success: false,
        data: null,
        error: {
          code: ErrorCodes.Resource.NotFound,
          message: "The requested resource was not found.",
          details: null,
        },
        meta: { requestId: c.get("requestId") ?? crypto.randomUUID() },
      },
      404,
    )
  );

  return app;
}
