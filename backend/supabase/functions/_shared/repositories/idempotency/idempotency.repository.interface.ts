export type IdempotencyRecord = {
  idempotencyKey: string;
  userId: string;
  operation: string;
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
  expiresAt: string;
};

export interface IdempotencyRepository {
  find(
    userId: string,
    operation: string,
    key: string,
  ): Promise<IdempotencyRecord | null>;

  save(record: IdempotencyRecord): Promise<void>;
}
