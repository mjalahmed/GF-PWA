import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import type { BusinessIdParamsDto } from "../business-management/business.schemas.ts";
import type {
  CreateServiceImageRequestDto,
  CreateServiceRequestDto,
  ListServicesQueryDto,
  ReplaceServiceCompatibilityRequestDto,
  ServiceImageParamsDto,
  ServiceParamsDto,
  UpdateServiceRequestDto,
} from "./service.schemas.ts";

export async function listServicesController(c: AppContext) {
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const query = (c.get("validatedQuery" as never) ?? {}) as ListServicesQueryDto;
  const { serviceService } = createRequestDependencies(c);
  const services = await serviceService.list(businessId, {
    activeOnly: query.activeOnly,
    branchId: query.branchId,
    categoryId: query.categoryId,
  });
  return successResponse(c, services);
}

export async function createServiceController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId } = (c.get("validatedParams" as never) ??
    {}) as BusinessIdParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as CreateServiceRequestDto;
  const { serviceService } = createRequestDependencies(c);
  const service = await serviceService.create(
    actorId,
    businessId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, service, 201);
}

export async function getServiceController(c: AppContext) {
  const { businessId, serviceId } = (c.get("validatedParams" as never) ??
    {}) as ServiceParamsDto;
  const { serviceService } = createRequestDependencies(c);
  const service = await serviceService.getById(businessId, serviceId);
  return successResponse(c, service);
}

export async function updateServiceController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, serviceId } = (c.get("validatedParams" as never) ??
    {}) as ServiceParamsDto;
  const body = (c.get("validatedBody" as never) ?? {}) as UpdateServiceRequestDto;
  const { serviceService } = createRequestDependencies(c);
  const service = await serviceService.update(
    actorId,
    businessId,
    serviceId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, service);
}

export async function deactivateServiceController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, serviceId } = (c.get("validatedParams" as never) ??
    {}) as ServiceParamsDto;
  const { serviceService } = createRequestDependencies(c);
  const result = await serviceService.deactivate(
    actorId,
    businessId,
    serviceId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function createServiceImageController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, serviceId } = (c.get("validatedParams" as never) ??
    {}) as ServiceParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as CreateServiceImageRequestDto;
  const { serviceService } = createRequestDependencies(c);
  const result = await serviceService.registerImageMetadata(
    actorId,
    businessId,
    serviceId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, result, 201);
}

export async function deleteServiceImageController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, serviceId, imageId } = (c.get("validatedParams" as never) ??
    {}) as ServiceImageParamsDto;
  const { serviceService } = createRequestDependencies(c);
  const result = await serviceService.deleteImage(
    actorId,
    businessId,
    serviceId,
    imageId,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function getServiceCompatibilityController(c: AppContext) {
  const { businessId, serviceId } = (c.get("validatedParams" as never) ??
    {}) as ServiceParamsDto;
  const { serviceService } = createRequestDependencies(c);
  const items = await serviceService.getCompatibility(businessId, serviceId);
  return successResponse(c, items);
}

export async function replaceServiceCompatibilityController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { businessId, serviceId } = (c.get("validatedParams" as never) ??
    {}) as ServiceParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as ReplaceServiceCompatibilityRequestDto;
  const { serviceService } = createRequestDependencies(c);
  const items = await serviceService.replaceCompatibility(
    actorId,
    businessId,
    serviceId,
    body,
    c.get("requestId"),
  );
  return successResponse(c, items);
}
