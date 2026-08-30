import type { AppContext } from "../core/responses/response.ts";
import { InternalError } from "../core/errors/app-error.ts";
import { SupabaseProfileRepository } from "../domains/profiles/profile.repository.ts";
import { ProfileService } from "../domains/profiles/profile.service.ts";
import { IdentityService } from "../domains/identity/identity.service.ts";
import { HealthService } from "../domains/health/health.service.ts";
import { SupabaseBusinessApplicationRepository } from "../domains/business-onboarding/business-application.repository.ts";
import { SupabaseBusinessDocumentRepository } from "../domains/business-onboarding/business-document.repository.ts";
import { SupabaseBusinessReviewRepository } from "../domains/business-onboarding/business-review.repository.ts";
import { BusinessApplicationService } from "../domains/business-onboarding/business-application.service.ts";
import { BusinessDocumentService } from "../domains/business-onboarding/business-document.service.ts";
import { SupabaseBusinessRepository } from "../domains/business-management/business.repository.ts";
import { SupabaseBranchRepository } from "../domains/business-management/branch.repository.ts";
import { SupabaseMembershipRepository } from "../domains/business-management/membership.repository.ts";
import { SupabaseInvitationRepository } from "../domains/business-management/invitation.repository.ts";
import { SupabaseScheduleRepository } from "../domains/business-management/schedule.repository.ts";
import { BusinessService } from "../domains/business-management/business.service.ts";
import { BranchService } from "../domains/business-management/branch.service.ts";
import { MembershipService } from "../domains/business-management/membership.service.ts";
import { InvitationService } from "../domains/business-management/invitation.service.ts";
import { ScheduleService } from "../domains/business-management/schedule.service.ts";
import { SupabaseCategoryRepository } from "../domains/catalog/category.repository.ts";
import { CategoryService } from "../domains/catalog/category.service.ts";
import { SupabaseServiceRepository } from "../domains/catalog/service.repository.ts";
import { ServiceService } from "../domains/catalog/service.service.ts";
import { SupabaseProductRepository } from "../domains/catalog/product.repository.ts";
import { ProductService } from "../domains/catalog/product.service.ts";
import { SupabaseInventoryRepository } from "../domains/catalog/inventory.repository.ts";
import { InventoryService } from "../domains/catalog/inventory.service.ts";
import { SupabaseVehicleRepository } from "../domains/vehicles/vehicle.repository.ts";
import { VehicleService } from "../domains/vehicles/vehicle.service.ts";
import { SupabaseAppointmentRepository } from "../domains/appointments/appointment.repository.ts";
import { AppointmentService } from "../domains/appointments/appointment.service.ts";
import { SupabaseQuotationRepository } from "../domains/quotations/quotation.repository.ts";
import { QuotationService } from "../domains/quotations/quotation.service.ts";
import { SupabaseInvoiceRepository } from "../domains/invoices/invoice.repository.ts";
import { InvoiceService } from "../domains/invoices/invoice.service.ts";
import { SupabaseReviewRepository } from "../domains/reviews/review.repository.ts";
import { ReviewService } from "../domains/reviews/review.service.ts";
import { SupabaseDisputeRepository } from "../domains/disputes/dispute.repository.ts";
import { DisputeService } from "../domains/disputes/dispute.service.ts";
import { SupabaseDiscoveryRepository } from "../domains/discovery/discovery.repository.ts";
import { DiscoveryService } from "../domains/discovery/discovery.service.ts";
import { SupabaseAuditRepository } from "../repositories/audit/supabase-audit.repository.ts";
import { SupabaseRoleRepository } from "../repositories/authorization/supabase-role.repository.ts";
import { SupabaseIdempotencyRepository } from "../repositories/idempotency/supabase-idempotency.repository.ts";
import { AuthorizationService } from "../repositories/authorization/authorization.service.ts";
import { AuditService } from "../repositories/audit/audit.service.ts";

/**
 * Per-request dependency graph.
 * User-scoped clients for profile/role reads; admin only for audit/idempotency.
 */
export function createRequestDependencies(c: AppContext) {
  const userClient = c.get("supabaseUserClient");
  const adminClient = c.get("supabaseAdminClient");

  if (!adminClient) {
    throw new InternalError("Admin client is not available.");
  }

  const auditRepository = new SupabaseAuditRepository(adminClient);
  const idempotencyRepository = new SupabaseIdempotencyRepository(adminClient);
  const healthService = new HealthService();
  const authorizationService = new AuthorizationService();
  const auditService = new AuditService(auditRepository);

  // Public business reads work without a user JWT (admin client + RLS-safe queries).
  const publicBusinessRepository = new SupabaseBusinessRepository(
    adminClient,
    adminClient,
  );
  const publicBranchRepository = new SupabaseBranchRepository(
    adminClient,
    adminClient,
  );
  const publicScheduleRepository = new SupabaseScheduleRepository(
    adminClient,
    adminClient,
  );
  const publicCategoryRepository = new SupabaseCategoryRepository(adminClient);
  const publicDiscoveryRepository = new SupabaseDiscoveryRepository(adminClient);
  const publicCategoryService = new CategoryService(publicCategoryRepository);
  const publicDiscoveryService = new DiscoveryService(
    publicDiscoveryRepository,
    publicCategoryRepository,
  );
  const publicReviewRepository = new SupabaseReviewRepository(adminClient);
  const publicReviewMembershipRepository = new SupabaseMembershipRepository(
    adminClient,
    adminClient,
  );
  const publicReviewService = new ReviewService(
    publicReviewRepository,
    publicBusinessRepository,
    publicReviewMembershipRepository,
    auditRepository,
  );
  const publicDisputeRepository = new SupabaseDisputeRepository(adminClient);
  const publicAppointmentRepository = new SupabaseAppointmentRepository(adminClient);
  const publicQuotationRepository = new SupabaseQuotationRepository(adminClient);
  const publicInvoiceRepository = new SupabaseInvoiceRepository(adminClient);
  const publicDisputeService = new DisputeService(
    publicDisputeRepository,
    publicBusinessRepository,
    publicReviewMembershipRepository,
    publicAppointmentRepository,
    publicQuotationRepository,
    publicInvoiceRepository,
    publicReviewRepository,
    auditRepository,
  );
  const publicBusinessService = new BusinessService(
    publicBusinessRepository,
    publicBranchRepository,
    publicScheduleRepository,
    auditRepository,
  );

  if (!userClient) {
    return {
      healthService,
      authorizationService,
      auditService,
      auditRepository,
      idempotencyRepository,
      profileService: null as unknown as ProfileService,
      identityService: null as unknown as IdentityService,
      roleRepository: null as unknown as SupabaseRoleRepository,
      businessApplicationService: null as unknown as BusinessApplicationService,
      businessDocumentService: null as unknown as BusinessDocumentService,
      businessRepository: publicBusinessRepository,
      businessService: publicBusinessService,
      branchService: null as unknown as BranchService,
      membershipService: null as unknown as MembershipService,
      invitationService: null as unknown as InvitationService,
      scheduleService: null as unknown as ScheduleService,
      categoryService: publicCategoryService,
      serviceService: null as unknown as ServiceService,
      productService: null as unknown as ProductService,
      inventoryService: null as unknown as InventoryService,
      vehicleService: null as unknown as VehicleService,
      appointmentService: null as unknown as AppointmentService,
      quotationService: null as unknown as QuotationService,
      invoiceService: null as unknown as InvoiceService,
      reviewService: publicReviewService,
      disputeService: publicDisputeService,
      discoveryService: publicDiscoveryService,
    };
  }

  const profileRepository = new SupabaseProfileRepository(userClient);
  const roleRepository = new SupabaseRoleRepository(userClient);
  const profileService = new ProfileService(profileRepository, auditRepository);
  const identityService = new IdentityService(profileService, roleRepository);

  const businessApplicationRepository = new SupabaseBusinessApplicationRepository(
    userClient,
    adminClient,
  );
  const businessDocumentRepository = new SupabaseBusinessDocumentRepository(
    userClient,
    adminClient,
  );
  const businessReviewRepository = new SupabaseBusinessReviewRepository(
    adminClient,
  );
  const businessApplicationService = new BusinessApplicationService(
    businessApplicationRepository,
    businessDocumentRepository,
    businessReviewRepository,
    auditRepository,
  );
  const businessDocumentService = new BusinessDocumentService(
    businessApplicationRepository,
    businessDocumentRepository,
  );

  const businessRepository = new SupabaseBusinessRepository(
    userClient,
    adminClient,
  );
  const branchRepository = new SupabaseBranchRepository(userClient, adminClient);
  const membershipRepository = new SupabaseMembershipRepository(
    userClient,
    adminClient,
  );
  const invitationRepository = new SupabaseInvitationRepository(
    userClient,
    adminClient,
  );
  const scheduleRepository = new SupabaseScheduleRepository(
    userClient,
    adminClient,
  );

  const businessService = new BusinessService(
    businessRepository,
    branchRepository,
    scheduleRepository,
    auditRepository,
  );
  const branchService = new BranchService(
    branchRepository,
    auditRepository,
  );
  const membershipService = new MembershipService(
    membershipRepository,
    businessRepository,
    auditRepository,
  );
  const invitationService = new InvitationService(
    invitationRepository,
    businessRepository,
    auditRepository,
  );
  const scheduleService = new ScheduleService(
    scheduleRepository,
    auditRepository,
  );

  const categoryRepository = new SupabaseCategoryRepository(userClient);
  const categoryService = new CategoryService(categoryRepository);
  const serviceRepository = new SupabaseServiceRepository(userClient, adminClient);
  const serviceService = new ServiceService(
    serviceRepository,
    branchRepository,
    categoryRepository,
    auditRepository,
  );
  const productRepository = new SupabaseProductRepository(userClient, adminClient);
  const productService = new ProductService(
    productRepository,
    branchRepository,
    categoryRepository,
    auditRepository,
  );
  const inventoryRepository = new SupabaseInventoryRepository(
    userClient,
    adminClient,
  );
  const inventoryService = new InventoryService(
    inventoryRepository,
    productRepository,
    branchRepository,
    auditRepository,
  );
  const vehicleRepository = new SupabaseVehicleRepository(userClient, adminClient);
  const vehicleService = new VehicleService(vehicleRepository, auditRepository);
  const appointmentRepository = new SupabaseAppointmentRepository(adminClient);
  // Booking validation reads branch/hours/services with admin after authz in the service.
  const appointmentBranchRepository = new SupabaseBranchRepository(
    adminClient,
    adminClient,
  );
  const appointmentScheduleRepository = new SupabaseScheduleRepository(
    adminClient,
    adminClient,
  );
  const appointmentServiceRepository = new SupabaseServiceRepository(
    adminClient,
    adminClient,
  );
  const appointmentService = new AppointmentService(
    appointmentRepository,
    businessRepository,
    appointmentBranchRepository,
    appointmentScheduleRepository,
    appointmentServiceRepository,
    vehicleRepository,
    membershipRepository,
    auditRepository,
  );
  const quotationRepository = new SupabaseQuotationRepository(adminClient);
  const quotationBranchRepository = new SupabaseBranchRepository(
    adminClient,
    adminClient,
  );
  const quotationServiceRepository = new SupabaseServiceRepository(
    adminClient,
    adminClient,
  );
  const quotationProductRepository = new SupabaseProductRepository(
    adminClient,
    adminClient,
  );
  const quotationVehicleRepository = new SupabaseVehicleRepository(
    adminClient,
    adminClient,
  );
  const quotationService = new QuotationService(
    quotationRepository,
    businessRepository,
    quotationBranchRepository,
    quotationServiceRepository,
    quotationProductRepository,
    quotationVehicleRepository,
    appointmentRepository,
    membershipRepository,
    auditRepository,
  );
  const invoiceRepository = new SupabaseInvoiceRepository(adminClient);
  const invoiceBranchRepository = new SupabaseBranchRepository(
    adminClient,
    adminClient,
  );
  const invoiceServiceRepository = new SupabaseServiceRepository(
    adminClient,
    adminClient,
  );
  const invoiceProductRepository = new SupabaseProductRepository(
    adminClient,
    adminClient,
  );
  const invoiceVehicleRepository = new SupabaseVehicleRepository(
    adminClient,
    adminClient,
  );
  const invoiceService = new InvoiceService(
    invoiceRepository,
    quotationRepository,
    businessRepository,
    invoiceBranchRepository,
    invoiceServiceRepository,
    invoiceProductRepository,
    invoiceVehicleRepository,
    appointmentRepository,
    membershipRepository,
    auditRepository,
  );
  const reviewRepository = new SupabaseReviewRepository(adminClient);
  const reviewService = new ReviewService(
    reviewRepository,
    businessRepository,
    membershipRepository,
    auditRepository,
  );
  const disputeRepository = new SupabaseDisputeRepository(adminClient);
  const disputeService = new DisputeService(
    disputeRepository,
    businessRepository,
    membershipRepository,
    appointmentRepository,
    quotationRepository,
    invoiceRepository,
    reviewRepository,
    auditRepository,
  );
  const discoveryRepository = new SupabaseDiscoveryRepository(userClient);
  const discoveryService = new DiscoveryService(
    discoveryRepository,
    categoryRepository,
  );

  return {
    healthService,
    authorizationService,
    auditService,
    auditRepository,
    idempotencyRepository,
    profileService,
    identityService,
    roleRepository,
    businessApplicationService,
    businessDocumentService,
    businessRepository,
    businessService,
    branchService,
    membershipService,
    invitationService,
    scheduleService,
    categoryService,
    serviceService,
    productService,
    inventoryService,
    vehicleService,
    appointmentService,
    quotationService,
    invoiceService,
    reviewService,
    disputeService,
    discoveryService,
  };
}

export type RequestDependencies = ReturnType<typeof createRequestDependencies>;
