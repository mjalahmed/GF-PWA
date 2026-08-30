import type { AuditRepository } from "./audit.repository.interface.ts";

export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  write(params: Parameters<AuditRepository["write"]>[0]) {
    return this.auditRepository.write(params);
  }
}
