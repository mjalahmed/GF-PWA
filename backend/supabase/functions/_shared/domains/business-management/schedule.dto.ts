export type OpeningHoursResponseDto = {
  id: string;
  businessId: string;
  branchId: string | null;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ClosureDateResponseDto = {
  id: string;
  businessId: string;
  branchId: string | null;
  closureDate: string;
  reason: string | null;
  isFullDay: boolean;
  opensAt: string | null;
  closesAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type {
  OpeningHoursQueryDto,
  ReplaceOpeningHoursRequestDto,
  ClosureDatesQueryDto,
  CreateClosureDateRequestDto,
  UpdateClosureDateRequestDto,
} from "./business.schemas.ts";
