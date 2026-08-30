import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BranchRepository } from "./branch.repository.interface.ts";
import { BranchNotFoundError } from "./business.errors.ts";
import { BranchMapper } from "./branch.mapper.ts";
import type {
  BranchResponseDto,
  CreateBranchRequestDto,
  MakePrimaryBranchResponseDto,
  UpdateBranchRequestDto,
} from "./branch.dto.ts";

export class BranchService {
  constructor(
    private readonly branchRepository: BranchRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  async list(businessId: string): Promise<BranchResponseDto[]> {
    const branches = await this.branchRepository.listByBusiness(businessId);
    return branches.map(BranchMapper.toDto);
  }

  async getById(businessId: string, branchId: string): Promise<BranchResponseDto> {
    const branch = await this.branchRepository.findById(businessId, branchId);
    if (!branch) throw new BranchNotFoundError(branchId);
    return BranchMapper.toDto(branch);
  }

  async create(
    actorUserId: string,
    businessId: string,
    input: CreateBranchRequestDto,
    requestId?: string,
  ): Promise<BranchResponseDto> {
    const branch = await this.branchRepository.create(businessId, {
      name: input.name,
      phone: input.phone,
      email: input.email,
      addressLine: input.addressLine,
      area: input.area,
      city: input.city,
      countryCode: input.countryCode,
      latitude: input.latitude,
      longitude: input.longitude,
      timezone: input.timezone,
      isPrimary: input.isPrimary,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "business.branch.created",
      entityType: "business_branch",
      entityId: branch.id,
      requestId,
      metadata: { businessId },
    });

    return BranchMapper.toDto(branch);
  }

  async update(
    actorUserId: string,
    businessId: string,
    branchId: string,
    input: UpdateBranchRequestDto,
    requestId?: string,
  ): Promise<BranchResponseDto> {
    const existing = await this.branchRepository.findById(businessId, branchId);
    if (!existing) throw new BranchNotFoundError(branchId);

    const updated = await this.branchRepository.update(businessId, branchId, input);

    await this.auditRepository.write({
      actorUserId,
      action: "business.branch.updated",
      entityType: "business_branch",
      entityId: branchId,
      requestId,
      metadata: { businessId },
    });

    return BranchMapper.toDto(updated);
  }

  async deactivate(
    actorUserId: string,
    businessId: string,
    branchId: string,
    requestId?: string,
  ): Promise<{ branchId: string; idempotent: boolean }> {
    const existing = await this.branchRepository.findById(businessId, branchId);
    if (!existing) throw new BranchNotFoundError(branchId);

    const result = await this.branchRepository.deactivateViaRpc(
      businessId,
      branchId,
      actorUserId,
    );

    if (!result.idempotent) {
      await this.auditRepository.write({
        actorUserId,
        action: "business.branch.deactivated",
        entityType: "business_branch",
        entityId: branchId,
        requestId,
        metadata: { businessId },
      });
    }

    return result;
  }

  async makePrimary(
    actorUserId: string,
    businessId: string,
    branchId: string,
    requestId?: string,
  ): Promise<MakePrimaryBranchResponseDto> {
    const existing = await this.branchRepository.findById(businessId, branchId);
    if (!existing) throw new BranchNotFoundError(branchId);

    const result = await this.branchRepository.makePrimaryViaRpc(
      businessId,
      branchId,
      actorUserId,
    );

    await this.auditRepository.write({
      actorUserId,
      action: "business.branch.primary_changed",
      entityType: "business_branch",
      entityId: branchId,
      requestId,
      metadata: {
        businessId,
        previousPrimaryBranchId: result.previousPrimaryBranchId,
      },
    });

    return result;
  }
}
