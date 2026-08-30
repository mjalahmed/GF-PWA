import type {
  CreateQuotationPersistenceInput,
  ListQuotationsFilters,
  QuotationRecord,
  TransitionPersistenceInput,
  UpdateDraftPersistenceInput,
} from "./quotation.types.ts";

export interface QuotationRepository {
  findById(
    quotationId: string,
    options?: { includeItems?: boolean; includeHistory?: boolean },
  ): Promise<QuotationRecord | null>;
  list(filters: ListQuotationsFilters): Promise<QuotationRecord[]>;
  listRevisions(rootQuotationId: string): Promise<QuotationRecord[]>;
  create(input: CreateQuotationPersistenceInput): Promise<QuotationRecord>;
  updateDraft(input: UpdateDraftPersistenceInput): Promise<QuotationRecord>;
  transition(input: TransitionPersistenceInput): Promise<QuotationRecord>;
  revise(fromId: string, createdBy: string): Promise<QuotationRecord>;
}
