import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { BranchRepository } from "../business-management/branch.repository.interface.ts";
import type { ProductRepository } from "./product.repository.interface.ts";
import type { InventoryRepository } from "./inventory.repository.interface.ts";
import { BranchBusinessMismatchError, ProductNotFoundError } from "./catalog.errors.ts";
import { InventoryMapper } from "./inventory.mapper.ts";
import type {
  AdjustInventoryRequestDto,
  AdjustInventoryResponseDto,
  InventoryResponseDto,
} from "./inventory.dto.ts";

export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly productRepository: ProductRepository,
    private readonly branchRepository: BranchRepository,
    private readonly _auditRepository: AuditRepository,
  ) {}

  async list(
    businessId: string,
    filters?: { branchId?: string; productId?: string },
  ): Promise<InventoryResponseDto[]> {
    const rows = await this.inventoryRepository.listByBusiness(
      businessId,
      filters,
    );
    return rows.map(InventoryMapper.toDto);
  }

  async listByProduct(
    businessId: string,
    productId: string,
  ): Promise<InventoryResponseDto[]> {
    const product = await this.productRepository.findById(businessId, productId);
    if (!product) throw new ProductNotFoundError(productId);
    const rows = await this.inventoryRepository.listByProduct(
      businessId,
      productId,
    );
    return rows.map(InventoryMapper.toDto);
  }

  async adjust(
    actorUserId: string,
    businessId: string,
    productId: string,
    input: AdjustInventoryRequestDto,
    requestId?: string,
  ): Promise<AdjustInventoryResponseDto> {
    const product = await this.productRepository.findById(businessId, productId);
    if (!product) throw new ProductNotFoundError(productId);

    const branch = await this.branchRepository.findById(
      businessId,
      input.branchId,
    );
    if (!branch) throw new BranchBusinessMismatchError();

    return this.inventoryRepository.adjustViaRpc(
      productId,
      input,
      actorUserId,
      requestId,
    );
  }
}
