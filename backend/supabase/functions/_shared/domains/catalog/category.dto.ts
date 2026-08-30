export type ServiceCategoryResponseDto = {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
};

export type ProductCategoryResponseDto = {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
};

export type VehicleMakeResponseDto = {
  id: string;
  name: string;
  slug: string;
};

export type VehicleModelResponseDto = {
  id: string;
  makeId: string;
  name: string;
  slug: string;
  startYear: number | null;
  endYear: number | null;
};
