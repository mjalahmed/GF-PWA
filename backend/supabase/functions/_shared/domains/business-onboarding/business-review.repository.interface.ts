import type {
  BusinessApplicationReviewRecord,
  CreateReviewPersistenceInput,
} from "./business-application.types.ts";

export interface BusinessReviewRepository {
  create(input: CreateReviewPersistenceInput): Promise<BusinessApplicationReviewRecord>;
  listByApplication(applicationId: string): Promise<BusinessApplicationReviewRecord[]>;
}
