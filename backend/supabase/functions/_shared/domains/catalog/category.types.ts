export type ServiceCategoryRecord = {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductCategoryRecord = {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type VehicleMakeRecord = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
};

export type VehicleModelRecord = {
  id: string;
  makeId: string;
  name: string;
  slug: string;
  startYear: number | null;
  endYear: number | null;
  isActive: boolean;
  createdAt: string;
};
