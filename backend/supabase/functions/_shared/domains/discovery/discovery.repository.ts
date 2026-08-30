import type { SupabaseClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  ConflictError,
  InternalError,
  NotFoundError,
} from "../../core/errors/app-error.ts";
import { ErrorCodes } from "../../core/constants/error-codes.ts";
import { CompatibilityTypes } from "../../core/constants/statuses.ts";
import type { BusinessBranchRecord } from "../business-management/business.types.ts";
import type { DiscoveryRepository } from "./discovery.repository.interface.ts";
import type {
  ClosureDateRow,
  CompatibilitySummaryRecord,
  DiscoveryBusinessRecord,
  DiscoverySearchFilters,
  FavoriteRecord,
  OpeningHoursRow,
  PublicImageRecord,
  PublicProductRecord,
  PublicServiceRecord,
  VehicleFilterContext,
} from "./discovery.types.ts";
import { normalizeSearchQuery } from "./discovery.utils.ts";

type BusinessRow = {
  id: string;
  slug: string;
  display_name: string;
  description: string | null;
  logo_path: string | null;
  cover_path: string | null;
  business_category_id: string;
  verification_status: string;
  average_rating: number;
  rating_count: number;
  created_at: string;
};

type BranchRow = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address_line: string;
  area: string | null;
  city: string | null;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function toBranch(row: BranchRow): BusinessBranchRecord {
  return {
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    addressLine: row.address_line,
    area: row.area,
    city: row.city,
    countryCode: row.country_code,
    latitude: row.latitude,
    longitude: row.longitude,
    timezone: row.timezone,
    isPrimary: row.is_primary,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function matchesVehicle(
  rows: CompatibilitySummaryRecord[],
  vehicle: VehicleFilterContext,
): boolean {
  if (rows.length === 0) return true;
  return rows.some((row) => {
    if (row.compatibilityType === CompatibilityTypes.AllVehicles) return true;
    if (row.compatibilityType === CompatibilityTypes.Make) {
      return vehicle.makeId != null && row.makeId === vehicle.makeId;
    }
    if (row.compatibilityType === CompatibilityTypes.Model) {
      return vehicle.makeId != null && vehicle.modelId != null &&
        row.makeId === vehicle.makeId && row.modelId === vehicle.modelId;
    }
    if (row.compatibilityType === CompatibilityTypes.YearRange) {
      if (vehicle.makeId == null || vehicle.year == null) return false;
      if (row.makeId !== vehicle.makeId) return false;
      if (row.minimumYear != null && vehicle.year < row.minimumYear) return false;
      if (row.maximumYear != null && vehicle.year > row.maximumYear) return false;
      return true;
    }
    return false;
  });
}

export class DiscoveryBusinessNotFoundError extends NotFoundError {
  constructor(slug?: string) {
    super("Business was not found.", slug ? { slug } : null);
    this.name = "DiscoveryBusinessNotFoundError";
  }
}

export class SupabaseDiscoveryRepository implements DiscoveryRepository {
  constructor(private readonly client: SupabaseClient) {}

  private async countActiveCatalog(
    businessIds: string[],
    table: "services" | "products",
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (businessIds.length === 0) return counts;

    const { data, error } = await this.client
      .from(table)
      .select("business_id")
      .in("business_id", businessIds)
      .eq("is_active", true);

    if (error) {
      throw new InternalError(`Failed to count ${table}.`, error);
    }

    for (const row of (data ?? []) as { business_id: string }[]) {
      counts.set(row.business_id, (counts.get(row.business_id) ?? 0) + 1);
    }
    return counts;
  }

  private async loadBranches(
    businessIds: string[],
    area?: string,
    city?: string,
  ): Promise<Map<string, BusinessBranchRecord[]>> {
    const map = new Map<string, BusinessBranchRecord[]>();
    if (businessIds.length === 0) return map;

    let query = this.client
      .from("business_branches")
      .select(
        "id, business_id, name, phone, email, address_line, area, city, country_code, latitude, longitude, timezone, is_primary, is_active, created_at, updated_at",
      )
      .in("business_id", businessIds)
      .eq("is_active", true);

    if (area) query = query.ilike("area", `%${area}%`);
    if (city) query = query.ilike("city", `%${city}%`);

    const { data, error } = await query;
    if (error) throw new InternalError("Failed to load branches.", error);

    for (const row of (data ?? []) as BranchRow[]) {
      const list = map.get(row.business_id) ?? [];
      list.push(toBranch(row));
      map.set(row.business_id, list);
    }
    return map;
  }

  async searchBusinesses(
    filters: DiscoverySearchFilters,
  ): Promise<{ items: DiscoveryBusinessRecord[]; total: number }> {
    const normalizedQuery = normalizeSearchQuery(filters.query);
    const queryTokens = normalizedQuery
      ? normalizedQuery.split(/\s+/).filter(Boolean)
      : [];

    const textMatches = (value: string | null | undefined): boolean => {
      if (queryTokens.length === 0) return true;
      const hay = (value ?? "").toLowerCase();
      return queryTokens.every((token) => hay.includes(token));
    };

    // Business IDs whose active services/products match the free-text query.
    const catalogQueryMatches = new Set<string>();
    // Business IDs constrained by service/product category filters (no free text).
    let categoryConstraint: Set<string> | null = null;

    if (filters.serviceCategory || normalizedQuery) {
      let serviceQuery = this.client
        .from("services")
        .select("business_id, name")
        .eq("is_active", true);
      if (filters.serviceCategory) {
        serviceQuery = serviceQuery.eq("category_id", filters.serviceCategory);
      }
      const { data: serviceRows, error: serviceError } = await serviceQuery;
      if (serviceError) {
        throw new InternalError("Failed to filter by services.", serviceError);
      }
      const serviceBusinessIds = new Set<string>();
      for (const row of (serviceRows ?? []) as { business_id: string; name: string }[]) {
        serviceBusinessIds.add(row.business_id);
        if (normalizedQuery && textMatches(row.name)) {
          catalogQueryMatches.add(row.business_id);
        }
      }
      if (filters.serviceCategory) {
        categoryConstraint = serviceBusinessIds;
      }
    }

    if (filters.productCategory || normalizedQuery) {
      let productQuery = this.client
        .from("products")
        .select("business_id, name, brand")
        .eq("is_active", true);
      if (filters.productCategory) {
        productQuery = productQuery.eq("category_id", filters.productCategory);
      }
      const { data: productRows, error: productError } = await productQuery;
      if (productError) {
        throw new InternalError("Failed to filter by products.", productError);
      }
      const productBusinessIds = new Set<string>();
      for (const row of (productRows ?? []) as {
        business_id: string;
        name: string;
        brand: string | null;
      }[]) {
        productBusinessIds.add(row.business_id);
        if (normalizedQuery && textMatches(`${row.name} ${row.brand ?? ""}`)) {
          catalogQueryMatches.add(row.business_id);
        }
      }
      if (filters.productCategory) {
        categoryConstraint = categoryConstraint
          ? new Set([...categoryConstraint].filter((id) => productBusinessIds.has(id)))
          : productBusinessIds;
      }
    }

    let query = this.client
      .from("businesses")
      .select(
        "id, slug, display_name, description, logo_path, cover_path, business_category_id, verification_status, average_rating, rating_count, created_at",
      )
      .eq("status", "active")
      .eq("verification_status", "verified");

    if (filters.businessCategory) {
      query = query.eq("business_category_id", filters.businessCategory);
    }
    if (filters.minimumRating != null) {
      query = query.gte("average_rating", filters.minimumRating);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new InternalError("Failed to search businesses.", error);

    let rows = (data ?? []) as BusinessRow[];

    // Free-text: match business name/description OR catalog item names/brands.
    if (normalizedQuery) {
      rows = rows.filter((r) =>
        textMatches(`${r.display_name} ${r.description ?? ""}`) ||
        catalogQueryMatches.has(r.id)
      );
    }

    // Category filters constrain to businesses that have matching catalog items.
    if (categoryConstraint) {
      rows = rows.filter((r) => categoryConstraint!.has(r.id));
    }

    const allIds = rows.map((r) => r.id);
    const branchesByBusiness = await this.loadBranches(
      allIds,
      filters.area,
      filters.city,
    );
    if (filters.area || filters.city) {
      rows = rows.filter((r) => (branchesByBusiness.get(r.id)?.length ?? 0) > 0);
    }

    const serviceCounts = await this.countActiveCatalog(allIds, "services");
    const productCounts = await this.countActiveCatalog(allIds, "products");
    if (filters.hasServices) {
      rows = rows.filter((r) => (serviceCounts.get(r.id) ?? 0) > 0);
    }
    if (filters.hasProducts) {
      rows = rows.filter((r) => (productCounts.get(r.id) ?? 0) > 0);
    }

    let items: DiscoveryBusinessRecord[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      displayName: row.display_name,
      description: row.description,
      logoPath: row.logo_path,
      coverPath: row.cover_path,
      businessCategoryId: row.business_category_id,
      verificationStatus: row.verification_status,
      averageRating: row.average_rating,
      ratingCount: row.rating_count,
      createdAt: row.created_at,
      branches: branchesByBusiness.get(row.id) ?? [],
      serviceCount: serviceCounts.get(row.id) ?? 0,
      productCount: productCounts.get(row.id) ?? 0,
    }));

    if (filters.sort === "name") {
      items.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (filters.sort === "rating") {
      items.sort((a, b) => b.averageRating - a.averageRating);
    } else if (filters.sort === "newest") {
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const total = items.length;
    const start = (filters.page - 1) * filters.pageSize;
    items = items.slice(start, start + filters.pageSize);
    return { items, total };
  }

  async findBusinessBySlug(slug: string): Promise<DiscoveryBusinessRecord | null> {
    const { data, error } = await this.client
      .from("businesses")
      .select(
        "id, slug, display_name, description, logo_path, cover_path, business_category_id, verification_status, average_rating, rating_count, created_at",
      )
      .eq("slug", slug)
      .eq("status", "active")
      .eq("verification_status", "verified")
      .maybeSingle();

    if (error) throw new InternalError("Failed to load business.", error);
    if (!data) return null;
    return this.toDiscoveryBusiness(data as BusinessRow);
  }

  async findBusinessById(businessId: string): Promise<DiscoveryBusinessRecord | null> {
    const { data, error } = await this.client
      .from("businesses")
      .select(
        "id, slug, display_name, description, logo_path, cover_path, business_category_id, verification_status, average_rating, rating_count, created_at",
      )
      .eq("id", businessId)
      .eq("status", "active")
      .eq("verification_status", "verified")
      .maybeSingle();

    if (error) throw new InternalError("Failed to load business.", error);
    if (!data) return null;
    return this.toDiscoveryBusiness(data as BusinessRow);
  }

  private async toDiscoveryBusiness(row: BusinessRow): Promise<DiscoveryBusinessRecord> {
    const branches = await this.loadBranches([row.id]);
    const serviceCounts = await this.countActiveCatalog([row.id], "services");
    const productCounts = await this.countActiveCatalog([row.id], "products");

    return {
      id: row.id,
      slug: row.slug,
      displayName: row.display_name,
      description: row.description,
      logoPath: row.logo_path,
      coverPath: row.cover_path,
      businessCategoryId: row.business_category_id,
      verificationStatus: row.verification_status,
      averageRating: row.average_rating,
      ratingCount: row.rating_count,
      createdAt: row.created_at,
      branches: branches.get(row.id) ?? [],
      serviceCount: serviceCounts.get(row.id) ?? 0,
      productCount: productCounts.get(row.id) ?? 0,
    };
  }

  async getOpeningHours(businessId: string): Promise<OpeningHoursRow[]> {
    const { data, error } = await this.client
      .from("business_opening_hours")
      .select("business_id, branch_id, day_of_week, opens_at, closes_at, is_closed")
      .eq("business_id", businessId);

    if (error) throw new InternalError("Failed to load opening hours.", error);
    return ((data ?? []) as {
      business_id: string;
      branch_id: string | null;
      day_of_week: number;
      opens_at: string | null;
      closes_at: string | null;
      is_closed: boolean;
    }[]).map((r) => ({
      businessId: r.business_id,
      branchId: r.branch_id,
      dayOfWeek: r.day_of_week,
      opensAt: r.opens_at,
      closesAt: r.closes_at,
      isClosed: r.is_closed,
    }));
  }

  async getClosureDates(businessId: string): Promise<ClosureDateRow[]> {
    const { data, error } = await this.client
      .from("business_closure_dates")
      .select(
        "business_id, branch_id, closure_date, is_full_day, opens_at, closes_at",
      )
      .eq("business_id", businessId);

    if (error) throw new InternalError("Failed to load closure dates.", error);
    return ((data ?? []) as {
      business_id: string;
      branch_id: string | null;
      closure_date: string;
      is_full_day: boolean;
      opens_at: string | null;
      closes_at: string | null;
    }[]).map((r) => ({
      businessId: r.business_id,
      branchId: r.branch_id,
      closureDate: r.closure_date,
      isFullDay: r.is_full_day,
      opensAt: r.opens_at,
      closesAt: r.closes_at,
    }));
  }

  async listPublicServices(
    businessId: string,
    filters?: { categoryId?: string; vehicle?: VehicleFilterContext },
    pagination = { page: 1, pageSize: 20 },
  ): Promise<{ items: PublicServiceRecord[]; total: number }> {
    let query = this.client
      .from("services")
      .select(
        "id, slug, name, description, category_id, pricing_type, price, minimum_price, maximum_price, estimated_duration_minutes, requires_appointment, requires_vehicle",
      )
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("name");

    if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list public services.", error);

    let items = ((data ?? []) as {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      category_id: string;
      pricing_type: PublicServiceRecord["pricingType"];
      price: number | null;
      minimum_price: number | null;
      maximum_price: number | null;
      estimated_duration_minutes: number | null;
      requires_appointment: boolean;
      requires_vehicle: boolean;
    }[]).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      categoryId: r.category_id,
      pricingType: r.pricing_type,
      price: r.price,
      minimumPrice: r.minimum_price,
      maximumPrice: r.maximum_price,
      estimatedDurationMinutes: r.estimated_duration_minutes,
      requiresAppointment: r.requires_appointment,
      requiresVehicle: r.requires_vehicle,
    }));

    if (filters?.vehicle) {
      const compat = await this.getServiceCompatibility(items.map((i) => i.id));
      items = items.filter((item) =>
        matchesVehicle(compat.get(item.id) ?? [], filters.vehicle!)
      );
    }

    const total = items.length;
    const start = (pagination.page - 1) * pagination.pageSize;
    items = items.slice(start, start + pagination.pageSize);
    return { items, total };
  }

  async listPublicProducts(
    businessId: string,
    filters?: { categoryId?: string; vehicle?: VehicleFilterContext },
    pagination = { page: 1, pageSize: 20 },
  ): Promise<{ items: PublicProductRecord[]; total: number }> {
    let query = this.client
      .from("products")
      .select(
        "id, slug, name, description, category_id, brand, price, sale_price, stock_status, warranty_description, installation_available",
      )
      .eq("business_id", businessId)
      .eq("is_active", true)
      .order("name");

    if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
    const { data, error } = await query;
    if (error) throw new InternalError("Failed to list public products.", error);

    let items = ((data ?? []) as {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      category_id: string;
      brand: string | null;
      price: number;
      sale_price: number | null;
      stock_status: PublicProductRecord["stockStatus"];
      warranty_description: string | null;
      installation_available: boolean;
    }[]).map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      categoryId: r.category_id,
      brand: r.brand,
      price: r.price,
      salePrice: r.sale_price,
      stockStatus: r.stock_status,
      warrantyDescription: r.warranty_description,
      installationAvailable: r.installation_available,
    }));

    if (filters?.vehicle) {
      const compat = await this.getProductCompatibility(items.map((i) => i.id));
      items = items.filter((item) =>
        matchesVehicle(compat.get(item.id) ?? [], filters.vehicle!)
      );
    }

    const total = items.length;
    const start = (pagination.page - 1) * pagination.pageSize;
    items = items.slice(start, start + pagination.pageSize);
    return { items, total };
  }

  async getServiceImages(serviceIds: string[]): Promise<Map<string, PublicImageRecord[]>> {
    const map = new Map<string, PublicImageRecord[]>();
    if (serviceIds.length === 0) return map;
    const { data, error } = await this.client
      .from("service_images")
      .select("id, service_id, storage_path, alt_text, sort_order, is_primary")
      .in("service_id", serviceIds)
      .order("sort_order");
    if (error) throw new InternalError("Failed to load service images.", error);
    for (const row of (data ?? []) as {
      id: string;
      service_id: string;
      storage_path: string;
      alt_text: string | null;
      sort_order: number;
      is_primary: boolean;
    }[]) {
      const list = map.get(row.service_id) ?? [];
      list.push({
        id: row.id,
        storagePath: row.storage_path,
        altText: row.alt_text,
        sortOrder: row.sort_order,
        isPrimary: row.is_primary,
      });
      map.set(row.service_id, list);
    }
    return map;
  }

  async getProductImages(productIds: string[]): Promise<Map<string, PublicImageRecord[]>> {
    const map = new Map<string, PublicImageRecord[]>();
    if (productIds.length === 0) return map;
    const { data, error } = await this.client
      .from("product_images")
      .select("id, product_id, storage_path, alt_text, sort_order, is_primary")
      .in("product_id", productIds)
      .order("sort_order");
    if (error) throw new InternalError("Failed to load product images.", error);
    for (const row of (data ?? []) as {
      id: string;
      product_id: string;
      storage_path: string;
      alt_text: string | null;
      sort_order: number;
      is_primary: boolean;
    }[]) {
      const list = map.get(row.product_id) ?? [];
      list.push({
        id: row.id,
        storagePath: row.storage_path,
        altText: row.alt_text,
        sortOrder: row.sort_order,
        isPrimary: row.is_primary,
      });
      map.set(row.product_id, list);
    }
    return map;
  }

  async getServiceCompatibility(
    serviceIds: string[],
  ): Promise<Map<string, CompatibilitySummaryRecord[]>> {
    const map = new Map<string, CompatibilitySummaryRecord[]>();
    if (serviceIds.length === 0) return map;
    const { data, error } = await this.client
      .from("service_vehicle_compatibility")
      .select(
        "service_id, compatibility_type, make_id, model_id, minimum_year, maximum_year",
      )
      .in("service_id", serviceIds);
    if (error) {
      throw new InternalError("Failed to load service compatibility.", error);
    }
    for (const row of (data ?? []) as {
      service_id: string;
      compatibility_type: CompatibilitySummaryRecord["compatibilityType"];
      make_id: string | null;
      model_id: string | null;
      minimum_year: number | null;
      maximum_year: number | null;
    }[]) {
      const list = map.get(row.service_id) ?? [];
      list.push({
        compatibilityType: row.compatibility_type,
        makeId: row.make_id,
        modelId: row.model_id,
        minimumYear: row.minimum_year,
        maximumYear: row.maximum_year,
      });
      map.set(row.service_id, list);
    }
    return map;
  }

  async getProductCompatibility(
    productIds: string[],
  ): Promise<Map<string, CompatibilitySummaryRecord[]>> {
    const map = new Map<string, CompatibilitySummaryRecord[]>();
    if (productIds.length === 0) return map;
    const { data, error } = await this.client
      .from("product_vehicle_compatibility")
      .select(
        "product_id, compatibility_type, make_id, model_id, minimum_year, maximum_year",
      )
      .in("product_id", productIds);
    if (error) {
      throw new InternalError("Failed to load product compatibility.", error);
    }
    for (const row of (data ?? []) as {
      product_id: string;
      compatibility_type: CompatibilitySummaryRecord["compatibilityType"];
      make_id: string | null;
      model_id: string | null;
      minimum_year: number | null;
      maximum_year: number | null;
    }[]) {
      const list = map.get(row.product_id) ?? [];
      list.push({
        compatibilityType: row.compatibility_type,
        makeId: row.make_id,
        modelId: row.model_id,
        minimumYear: row.minimum_year,
        maximumYear: row.maximum_year,
      });
      map.set(row.product_id, list);
    }
    return map;
  }

  async listFavorites(customerId: string): Promise<FavoriteRecord[]> {
    const { data, error } = await this.client
      .from("favorites")
      .select("id, customer_id, business_id, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) throw new InternalError("Failed to list favorites.", error);
    return ((data ?? []) as {
      id: string;
      customer_id: string;
      business_id: string;
      created_at: string;
    }[]).map((r) => ({
      id: r.id,
      customerId: r.customer_id,
      businessId: r.business_id,
      createdAt: r.created_at,
    }));
  }

  async addFavorite(
    customerId: string,
    businessId: string,
  ): Promise<FavoriteRecord> {
    const { data, error } = await this.client
      .from("favorites")
      .insert({ customer_id: customerId, business_id: businessId })
      .select("id, customer_id, business_id, created_at")
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new ConflictError(
          ErrorCodes.Resource.Conflict,
          "Business is already favorited.",
        );
      }
      throw new InternalError("Failed to add favorite.", error);
    }
    const row = data as {
      id: string;
      customer_id: string;
      business_id: string;
      created_at: string;
    };
    return {
      id: row.id,
      customerId: row.customer_id,
      businessId: row.business_id,
      createdAt: row.created_at,
    };
  }

  async removeFavorite(customerId: string, businessId: string): Promise<void> {
    const { error } = await this.client
      .from("favorites")
      .delete()
      .eq("customer_id", customerId)
      .eq("business_id", businessId);
    if (error) throw new InternalError("Failed to remove favorite.", error);
  }

  async findVehicleForFilter(
    vehicleId: string,
    customerId?: string,
  ): Promise<VehicleFilterContext | null> {
    let query = this.client
      .from("vehicles")
      .select("make_id, model_id, year, customer_id, is_active")
      .eq("id", vehicleId)
      .eq("is_active", true);
    if (customerId) query = query.eq("customer_id", customerId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new InternalError("Failed to load vehicle filter.", error);
    if (!data) return null;
    const row = data as {
      make_id: string | null;
      model_id: string | null;
      year: number;
    };
    return { makeId: row.make_id, modelId: row.model_id, year: row.year };
  }

  async businessIdsWithMatchingCatalog(input: {
    businessIds: string[];
    vehicle: VehicleFilterContext;
    catalog: "services" | "products";
    categoryId?: string;
  }): Promise<Set<string>> {
    const result = new Set<string>();
    if (input.businessIds.length === 0) return result;
    let query = this.client
      .from(input.catalog)
      .select("id, business_id")
      .in("business_id", input.businessIds)
      .eq("is_active", true);
    if (input.categoryId) query = query.eq("category_id", input.categoryId);
    const { data, error } = await query;
    if (error) {
      throw new InternalError(`Failed to filter ${input.catalog} by vehicle.`, error);
    }
    const rows = (data ?? []) as { id: string; business_id: string }[];
    const compat = input.catalog === "services"
      ? await this.getServiceCompatibility(rows.map((r) => r.id))
      : await this.getProductCompatibility(rows.map((r) => r.id));
    for (const row of rows) {
      if (matchesVehicle(compat.get(row.id) ?? [], input.vehicle)) {
        result.add(row.business_id);
      }
    }
    return result;
  }
}
