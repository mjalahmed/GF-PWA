import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import { InternalError, NotFoundError } from "../../core/errors/app-error.ts";
import type { BusinessDocumentRepository } from "./business-document.repository.interface.ts";
import type {
  BusinessApplicationDocumentRecord,
  CreateDocumentPersistenceInput,
  ReviewDocumentPersistenceInput,
} from "./business-application.types.ts";

type DocumentRow = {
  id: string;
  application_id: string;
  document_requirement_id: string;
  document_type: string;
  storage_path: string;
  original_file_name: string;
  mime_type: string;
  file_size_bytes: number;
  document_number: string | null;
  expires_at: string | null;
  status: string;
  rejection_reason: string | null;
  uploaded_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

const DOCUMENT_SELECT =
  "id, application_id, document_requirement_id, document_type, storage_path, original_file_name, mime_type, file_size_bytes, document_number, expires_at, status, rejection_reason, uploaded_by, reviewed_by, reviewed_at, created_at, updated_at";

function toDocumentRecord(
  row: DocumentRow,
): BusinessApplicationDocumentRecord {
  return {
    id: row.id,
    applicationId: row.application_id,
    documentRequirementId: row.document_requirement_id,
    documentType: row.document_type,
    storagePath: row.storage_path,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    documentNumber: row.document_number,
    expiresAt: row.expires_at,
    status: row.status,
    rejectionReason: row.rejection_reason,
    uploadedBy: row.uploaded_by,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseBusinessDocumentRepository
  implements BusinessDocumentRepository {
  constructor(
    private readonly userClient: SupabaseClient,
    private readonly adminClient: SupabaseClient,
  ) {}

  async listByApplication(
    applicationId: string,
  ): Promise<BusinessApplicationDocumentRecord[]> {
    const { data, error } = await this.userClient
      .from("business_application_documents")
      .select(DOCUMENT_SELECT)
      .eq("application_id", applicationId)
      .order("created_at");

    if (error) throw new InternalError("Failed to list documents.", error);
    return ((data ?? []) as DocumentRow[]).map(toDocumentRecord);
  }

  async findById(id: string): Promise<BusinessApplicationDocumentRecord | null> {
    const { data, error } = await this.userClient
      .from("business_application_documents")
      .select(DOCUMENT_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) throw new InternalError("Failed to load document.", error);
    if (!data) return null;
    return toDocumentRecord(data as DocumentRow);
  }

  async create(
    input: CreateDocumentPersistenceInput,
  ): Promise<BusinessApplicationDocumentRecord> {
    const row: Record<string, unknown> = {
        application_id: input.applicationId,
        document_requirement_id: input.documentRequirementId,
        document_type: input.documentType,
        storage_path: input.storagePath,
        original_file_name: input.originalFileName,
        mime_type: input.mimeType,
        file_size_bytes: input.fileSizeBytes,
        document_number: input.documentNumber ?? null,
        expires_at: input.expiresAt ?? null,
        uploaded_by: input.uploadedBy,
      };
    if (input.id) row.id = input.id;

    const { data, error } = await this.userClient
      .from("business_application_documents")
      .insert(row)
      .select(DOCUMENT_SELECT)
      .single();

    if (error) throw new InternalError("Failed to create document.", error);
    if (!data) throw new InternalError("Failed to create document.");
    return toDocumentRecord(data as DocumentRow);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.userClient
      .from("business_application_documents")
      .delete()
      .eq("id", id);

    if (error) throw new InternalError("Failed to delete document.", error);
  }

  async updateReview(
    id: string,
    input: ReviewDocumentPersistenceInput,
  ): Promise<BusinessApplicationDocumentRecord> {
    const { data, error } = await this.adminClient
      .from("business_application_documents")
      .update({
        status: input.status,
        rejection_reason: input.rejectionReason ?? null,
        reviewed_by: input.reviewedBy,
        reviewed_at: input.reviewedAt,
      })
      .eq("id", id)
      .select(DOCUMENT_SELECT)
      .single();

    if (error) throw new InternalError("Failed to review document.", error);
    if (!data) throw new NotFoundError("Application document was not found.");
    return toDocumentRecord(data as DocumentRow);
  }
}
