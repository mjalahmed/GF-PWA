import type { AuditRepository } from "../../repositories/audit/audit.repository.interface.ts";
import type { ScheduleRepository } from "./schedule.repository.interface.ts";
import { NotFoundError } from "../../core/errors/app-error.ts";
import { ClosureNotFoundError } from "./business.errors.ts";
import { ScheduleMapper } from "./schedule.mapper.ts";
import type {
  ClosureDateResponseDto,
  CreateClosureDateRequestDto,
  OpeningHoursResponseDto,
  ReplaceOpeningHoursRequestDto,
  UpdateClosureDateRequestDto,
} from "./schedule.dto.ts";
import type { OpeningHoursQueryDto, ClosureDatesQueryDto } from "./business.schemas.ts";

export class ScheduleService {
  constructor(
    private readonly scheduleRepository: ScheduleRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  async listOpeningHours(
    businessId: string,
    query: OpeningHoursQueryDto,
  ): Promise<OpeningHoursResponseDto[]> {
    const rows = await this.scheduleRepository.listOpeningHours(
      businessId,
      query.branchId ?? null,
    );
    return rows.map(ScheduleMapper.toOpeningHoursDto);
  }

  async replaceOpeningHours(
    actorUserId: string,
    businessId: string,
    input: ReplaceOpeningHoursRequestDto,
    requestId?: string,
  ): Promise<OpeningHoursResponseDto[]> {
    const branchId = input.branchId ?? null;
    const rows = await this.scheduleRepository.replaceOpeningHours(
      businessId,
      branchId,
      input.schedule.map((day) => ({
        branchId,
        dayOfWeek: day.dayOfWeek,
        opensAt: day.opensAt ?? null,
        closesAt: day.closesAt ?? null,
        isClosed: day.isClosed,
      })),
    );

    await this.auditRepository.write({
      actorUserId,
      action: "business.opening_hours.updated",
      entityType: "business_opening_hours",
      entityId: businessId,
      requestId,
      metadata: { businessId, branchId },
    });

    return rows.map(ScheduleMapper.toOpeningHoursDto);
  }

  async listClosureDates(
    businessId: string,
    query: ClosureDatesQueryDto,
  ): Promise<ClosureDateResponseDto[]> {
    const rows = await this.scheduleRepository.listClosureDates(businessId, {
      branchId: query.branchId,
      from: query.from,
      to: query.to,
    });
    return rows.map(ScheduleMapper.toClosureDateDto);
  }

  async createClosureDate(
    actorUserId: string,
    businessId: string,
    input: CreateClosureDateRequestDto,
    requestId?: string,
  ): Promise<ClosureDateResponseDto> {
    const row = await this.scheduleRepository.createClosureDate(businessId, {
      branchId: input.branchId ?? null,
      closureDate: input.closureDate,
      reason: input.reason,
      isFullDay: input.isFullDay,
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      createdBy: actorUserId,
    });

    await this.auditRepository.write({
      actorUserId,
      action: "business.closure_date.created",
      entityType: "business_closure_date",
      entityId: row.id,
      requestId,
      metadata: { businessId },
    });

    return ScheduleMapper.toClosureDateDto(row);
  }

  async updateClosureDate(
    actorUserId: string,
    businessId: string,
    closureId: string,
    input: UpdateClosureDateRequestDto,
    requestId?: string,
  ): Promise<ClosureDateResponseDto> {
    const row = await this.scheduleRepository.updateClosureDate(
      businessId,
      closureId,
      input,
    );

    await this.auditRepository.write({
      actorUserId,
      action: "business.closure_date.updated",
      entityType: "business_closure_date",
      entityId: closureId,
      requestId,
      metadata: { businessId },
    });

    return ScheduleMapper.toClosureDateDto(row);
  }

  async deleteClosureDate(
    actorUserId: string,
    businessId: string,
    closureId: string,
    requestId?: string,
  ): Promise<void> {
    try {
      await this.scheduleRepository.deleteClosureDate(businessId, closureId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new ClosureNotFoundError(closureId);
      }
      throw error;
    }

    await this.auditRepository.write({
      actorUserId,
      action: "business.closure_date.deleted",
      entityType: "business_closure_date",
      entityId: closureId,
      requestId,
      metadata: { businessId },
    });
  }
}
