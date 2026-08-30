import type {
  BusinessApplicationDocumentRecord,
  CreateDocumentPersistenceInput,
  ReviewDocumentPersistenceInput,
} from "./business-application.types.ts";

export interface BusinessDocumentRepository {
  listByApplication(
    applicationId: string,
  ): Promise<BusinessApplicationDocumentRecord[]>;
  findById(id: string): Promise<BusinessApplicationDocumentRecord | null>;
  create(
    input: CreateDocumentPersistenceInput,
  ): Promise<BusinessApplicationDocumentRecord>;
  delete(id: string): Promise<void>;
  updateReview(
    id: string,
    input: ReviewDocumentPersistenceInput,
  ): Promise<BusinessApplicationDocumentRecord>;
}
