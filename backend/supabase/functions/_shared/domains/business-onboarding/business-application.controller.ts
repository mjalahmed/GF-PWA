import type { AppContext } from "../../core/responses/response.ts";
import { successResponse } from "../../core/responses/response.ts";
import { createRequestDependencies } from "../../composition/dependencies.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import type {
  AssignReviewerRequestDto,
  CreateApplicationRequestDto,
  CreateDocumentRequestDto,
  ListApplicationsQueryDto,
  RejectApplicationRequestDto,
  RequestChangesRequestDto,
  ReviewDocumentRequestDto,
  UpdateApplicationRequestDto,
  UpdateBranchRequestDto,
  ApplicationDocumentParamsDto,
  ApplicationIdParamsDto,
  CategoryIdParamsDto,
} from "./business-application.schemas.ts";

function permissions(c: AppContext): string[] {
  return c.get("permissions") ?? [];
}

export async function listCategoriesController(c: AppContext) {
  const { businessApplicationService } = createRequestDependencies(c);
  const categories = await businessApplicationService.listCategories();
  return successResponse(c, categories);
}

export async function listRequirementsController(c: AppContext) {
  const { categoryId } = (c.get("validatedParams" as never) ??
    {}) as CategoryIdParamsDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const requirements = await businessApplicationService.listRequirements(
    categoryId,
  );
  return successResponse(c, requirements);
}

export async function createApplicationController(c: AppContext) {
  const userId = c.get("userId")!;
  const body = (c.get("validatedBody" as never) ??
    {}) as CreateApplicationRequestDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const application = await businessApplicationService.createDraft(userId, body);
  return successResponse(c, application, 201);
}

export async function listApplicationsController(c: AppContext) {
  const userId = c.get("userId")!;
  const query = (c.get("validatedQuery" as never) ??
    {}) as ListApplicationsQueryDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const perms = permissions(c);

  if (perms.includes(Permissions.BusinessApplication.ReadAll)) {
    const result = await businessApplicationService.listAll(query);
    return successResponse(c, result.items, 200, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: Math.ceil(result.total / result.pageSize) || 0,
    });
  }

  const applications = await businessApplicationService.listMine(userId);
  return successResponse(c, applications);
}

export async function listMyApplicationsController(c: AppContext) {
  return listApplicationsController(c);
}

export async function listAllApplicationsController(c: AppContext) {
  return listApplicationsController(c);
}

export async function getApplicationController(c: AppContext) {
  const userId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const detail = await businessApplicationService.getById(
    userId,
    id,
    permissions(c),
  );
  return successResponse(c, detail);
}

export async function updateApplicationController(c: AppContext) {
  const userId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as UpdateApplicationRequestDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const application = await businessApplicationService.updateDraft(
    userId,
    id,
    body,
  );
  return successResponse(c, application);
}

export async function updateBranchController(c: AppContext) {
  const userId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as UpdateBranchRequestDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const branch = await businessApplicationService.updateBranch(userId, id, body);
  return successResponse(c, branch);
}

export async function submitApplicationController(c: AppContext) {
  const userId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const application = await businessApplicationService.submit(
    userId,
    id,
    c.get("requestId"),
  );
  return successResponse(c, application);
}

export async function withdrawApplicationController(c: AppContext) {
  const userId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const application = await businessApplicationService.withdraw(
    userId,
    id,
    c.get("requestId"),
  );
  return successResponse(c, application);
}

export async function assignReviewerController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as AssignReviewerRequestDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const application = await businessApplicationService.assignReviewer(
    actorId,
    id,
    body.reviewerId,
    c.get("requestId"),
  );
  return successResponse(c, application);
}

export async function startReviewController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const application = await businessApplicationService.startReview(
    actorId,
    id,
    c.get("requestId"),
  );
  return successResponse(c, application);
}

export async function requestChangesController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as RequestChangesRequestDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const application = await businessApplicationService.requestChanges(
    actorId,
    id,
    body,
    c.get("requestId"),
  );
  return successResponse(c, application);
}

export async function approveApplicationController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const result = await businessApplicationService.approve(
    actorId,
    id,
    c.get("requestId"),
  );
  return successResponse(c, result);
}

export async function rejectApplicationController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as RejectApplicationRequestDto;
  const { businessApplicationService } = createRequestDependencies(c);
  const application = await businessApplicationService.reject(
    actorId,
    id,
    body,
    c.get("requestId"),
  );
  return successResponse(c, application);
}

export async function listDocumentsController(c: AppContext) {
  const userId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const { businessDocumentService } = createRequestDependencies(c);
  const documents = await businessDocumentService.listDocuments(
    userId,
    id,
    permissions(c),
  );
  return successResponse(c, documents);
}

export async function createDocumentController(c: AppContext) {
  const userId = c.get("userId")!;
  const { id } = (c.get("validatedParams" as never) ??
    {}) as ApplicationIdParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as CreateDocumentRequestDto;
  const { businessDocumentService } = createRequestDependencies(c);
  const result = await businessDocumentService.createDocumentMetadata(
    userId,
    id,
    body,
  );
  return successResponse(c, result, 201);
}

export async function deleteDocumentController(c: AppContext) {
  const userId = c.get("userId")!;
  const { id, documentId } = (c.get("validatedParams" as never) ??
    {}) as ApplicationDocumentParamsDto;
  const { businessDocumentService } = createRequestDependencies(c);
  await businessDocumentService.deleteDocument(userId, id, documentId);
  return successResponse(c, { deleted: true });
}

export async function reviewDocumentController(c: AppContext) {
  const actorId = c.get("userId")!;
  const { id, documentId } = (c.get("validatedParams" as never) ??
    {}) as ApplicationDocumentParamsDto;
  const body = (c.get("validatedBody" as never) ??
    {}) as ReviewDocumentRequestDto;
  const { businessDocumentService } = createRequestDependencies(c);
  const document = await businessDocumentService.reviewDocument(
    actorId,
    id,
    documentId,
    body,
  );
  return successResponse(c, document);
}
