import type { SupabaseClient, User } from "npm:@supabase/supabase-js@2.49.1";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  raw: User;
};

export type AppVariables = {
  requestId: string;
  accessToken: string | null;
  user: AuthenticatedUser | null;
  userId: string | null;
  roles: string[];
  permissions: string[];
  supabaseUserClient: SupabaseClient | null;
  supabaseAdminClient: SupabaseClient;
  businessId: string | null;
  businessStatus: string | null;
  membershipId: string | null;
  membershipRole: string | null;
  businessPermissions: string[];
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiMeta = {
  requestId: string;
  pagination?: PaginationMeta;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
  meta: ApiMeta;
};

export type ApiFailure = {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details: unknown;
  };
  meta: ApiMeta;
};
