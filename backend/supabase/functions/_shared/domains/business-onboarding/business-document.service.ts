import { ValidationError } from "../../core/errors/app-error.ts";
import { Permissions } from "../../core/constants/permissions.ts";
import type { BusinessApplicationRepository } from "./business-application.repository.interface.ts";
import type { BusinessDocumentRepository } from "./business-document.repository.interface.ts";
import {
  ApplicationAccessDeniedError,
  ApplicationNotFoundError,
  DocumentNotFoundError,
  RequirementNotFoundError,
  assertApplicationEditable,
} from "./business-application.errors.ts";
import {
  BusinessApplicationMapper,
  buildDocumentStoragePath,
} from "./business-application.mapper.ts";
import type {
  BusinessApplicationDocumentResponseDto,
  CreateDocumentMetadataResponseDto,
  CreateDocumentRequestDto,
  ReviewDocumentRequestDto,
} from "./business-application.dto.ts";
import {
  BUSINESS_APPLICATION_DOCUMENTS_BUCKET,
  type BusinessApplicationRecord,
} from "./business-application.types.ts";

export class BusinessDocumentService {
  constructor(
    private readonly applicationRepository: BusinessApplicationRepository,
    private readonly documentRepository: BusinessDocumentRepository,
  ) {}

  private async getOwnedApplication(
    userId: string,
    applicationId: string,
    permissions: string[],
  ): Promise<BusinessApplicationRecord> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) throw new ApplicationNotFoundError(applicationId);

    const canReadAll = permissions.includes(
      Permissions.BusinessApplication.ReadAll,
    );
    const canReadDocs = permissions.includes(Permissions.BusinessDocument.Read);
    const isOwner = application.applicantUserId === userId;

    if (!isOwner && !canReadAll && !canReadDocs) {
      throw new ApplicationAccessDeniedError();
    }

    return application;
  }

  async listDocuments(
    userId: string,
    applicationId: string,
    permissions: string[],
  ): Promise<BusinessApplicationDocumentResponseDto[]> {
    await this.getOwnedApplication(userId, applicationId, permissions);
    const documents = await this.documentRepository.listByApplication(
      applicationId,
    );
    return documents.map(BusinessApplicationMapper.toDocumentDto);
  }

  async createDocumentMetadata(
    userId: string,
    applicationId: string,
    input: CreateDocumentRequestDto,
  ): Promise<CreateDocumentMetadataResponseDto> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) throw new ApplicationNotFoundError(applicationId);
    if (application.applicantUserId !== userId) {
      throw new ApplicationAccessDeniedError();
    }
    assertApplicationEditable(application.status);

    const requirement = await this.applicationRepository.findRequirementById(
      input.documentRequirementId,
    );
    if (!requirement) {
      throw new RequirementNotFoundError(input.documentRequirementId);
    }
    if (requirement.businessCategoryId !== application.businessCategoryId) {
      throw new ValidationError(
        "Document requirement does not belong to this application's category.",
      );
    }
    if (!requirement.allowedMimeTypes.includes(input.mimeType)) {
      throw new ValidationError("MIME type is not allowed for this requirement.");
    }
    if (input.fileSizeBytes > requirement.maximumFileSizeBytes) {
      throw new ValidationError("File exceeds maximum allowed size.");
    }
    if (requirement.requiresExpiryDate && !input.expiresAt) {
      throw new ValidationError("expiresAt is required for this document type.");
    }

    const documentId = crypto.randomUUID();
    const storagePath = buildDocumentStoragePath(
      userId,
      applicationId,
      documentId,
      input.originalFileName,
    );

    const document = await this.documentRepository.create({
      id: documentId,
      applicationId,
      documentRequirementId: input.documentRequirementId,
      documentType: requirement.documentType,
      storagePath,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      documentNumber: input.documentNumber,
      expiresAt: input.expiresAt,
      uploadedBy: userId,
    });

    return {
      document: BusinessApplicationMapper.toDocumentDto(document),
      storagePath,
      bucket: BUSINESS_APPLICATION_DOCUMENTS_BUCKET,
    };
  }

  async deleteDocument(
    userId: string,
    applicationId: string,
    documentId: string,
  ): Promise<void> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) throw new ApplicationNotFoundError(applicationId);
    if (application.applicantUserId !== userId) {
      throw new ApplicationAccessDeniedError();
    }
    assertApplicationEditable(application.status);

    const document = await this.documentRepository.findById(documentId);
    if (!document || document.applicationId !== applicationId) {
      throw new DocumentNotFoundError(documentId);
    }

    await this.documentRepository.delete(documentId);
  }

  async reviewDocument(
    actorId: string,
    applicationId: string,
    documentId: string,
    input: ReviewDocumentRequestDto,
  ): Promise<BusinessApplicationDocumentResponseDto> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) throw new ApplicationNotFoundError(applicationId);

    const document = await this.documentRepository.findById(documentId);
    if (!document || document.applicationId !== applicationId) {
      throw new DocumentNotFoundError(documentId);
    }

    const reviewed = await this.documentRepository.updateReview(documentId, {
      status: input.status,
      rejectionReason: input.rejectionReason,
      reviewedBy: actorId,
      reviewedAt: new Date().toISOString(),
    });

    return BusinessApplicationMapper.toDocumentDto(reviewed);
  }
}
