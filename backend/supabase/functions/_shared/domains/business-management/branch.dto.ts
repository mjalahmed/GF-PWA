export type BranchResponseDto = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  addressLine: string;
  area: string | null;
  city: string | null;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MakePrimaryBranchResponseDto = {
  branchId: string;
  previousPrimaryBranchId: string | null;
};

export type {
  CreateBranchRequestDto,
  UpdateBranchRequestDto,
} from "./branch.schemas.ts";
