import type {
  AddDisputeMessagePersistenceInput,
  CreateDisputeEvidencePersistenceInput,
  CreateDisputePersistenceInput,
  DisputeRecord,
  DisputeSourceContext,
  DisputeSourceRefs,
  DisputeWindowEventTimestamps,
  ListDisputesFilters,
  RecordDisputeActionPersistenceInput,
  UpdateDisputeStatusPersistenceInput,
} from "./dispute.types.ts";

export type ListDisputesResult = {
  items: DisputeRecord[];
  total: number;
};

export type CreateEvidenceResult = {
  evidenceId: string;
  storagePath: string;
  uploadUrl: string;
};

export interface DisputeRepository {
  findById(
    disputeId: string,
    options?: {
      includeMessages?: boolean;
      includeEvidence?: boolean;
      includeHistory?: boolean;
      includeActions?: boolean;
      signedEvidenceUrls?: boolean;
    },
  ): Promise<DisputeRecord | null>;
  list(filters: ListDisputesFilters): Promise<ListDisputesResult>;
  create(input: CreateDisputePersistenceInput): Promise<DisputeRecord>;
  findActiveBySource(sources: DisputeSourceRefs): Promise<DisputeRecord | null>;
  updateStatus(input: UpdateDisputeStatusPersistenceInput): Promise<DisputeRecord>;
  assignAdmin(
    disputeId: string,
    assignedAdminId: string,
    performedBy: string,
  ): Promise<DisputeRecord>;
  addMessage(input: AddDisputeMessagePersistenceInput): Promise<DisputeRecord>;
  createEvidenceMetadata(
    input: CreateDisputeEvidencePersistenceInput,
  ): Promise<CreateEvidenceResult>;
  appendInternalNotes(disputeId: string, note: string): Promise<void>;
  recordAction(input: RecordDisputeActionPersistenceInput): Promise<void>;
  loadSourceContext(record: DisputeRecord): Promise<DisputeSourceContext>;
  loadWindowEvents(record: DisputeRecord): Promise<DisputeWindowEventTimestamps>;
}
