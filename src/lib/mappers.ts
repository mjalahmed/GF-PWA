import { pick, pickBool, pickNum } from '../lib/map'
import type { DiscoveryBusiness, FavoriteBusiness, Profile, Vehicle } from '../types/discovery'
import type {
  Appointment,
  AppointmentServiceLine,
  AppointmentSlotsResult,
  AppointmentSlot,
} from '../types/appointments'
import type { Invoice, Payment, Quotation, LineItem } from '../types/commerce'
import type { Review, ReviewEligibility, ReviewRatingDimensions } from '../types/reviews'
import type { Dispute, DisputeEvidence, DisputeMessage } from '../types/disputes'
import type { ProductOrder, ProductOrderItem } from '../types/orders'
import type {
  CategoryRef,
  PublicImage,
  PublicProduct,
  PublicService,
  VehicleMake,
  VehicleModel,
} from '../types/catalog'

export function mapCategoryRef(raw: Record<string, unknown>): CategoryRef {
  return {
    id: String(raw.id),
    code: String(raw.code),
    name: String(raw.name),
  }
}

export function mapPublicImage(raw: Record<string, unknown>): PublicImage {
  return {
    id: String(raw.id),
    storagePath: String(pick(raw, 'storagePath', 'storage_path') ?? ''),
    altText: pick(raw, 'altText', 'alt_text') as string | undefined,
    sortOrder: pickNum(raw, 'sortOrder', 'sort_order') ?? 0,
    isPrimary: pickBool(raw, 'isPrimary', 'is_primary'),
  }
}

export function mapPublicService(raw: Record<string, unknown>): PublicService {
  const cat = (raw.category ?? raw.serviceCategory) as Record<string, unknown> | undefined
  return {
    id: String(raw.id),
    slug: String(raw.slug),
    name: String(raw.name ?? raw.displayName),
    description: pick(raw, 'description') as string | undefined,
    category: cat ? mapCategoryRef(cat) : { id: '', code: '', name: 'General' },
    pricingType: String(pick(raw, 'pricingType', 'pricing_type') ?? 'fixed'),
    price: pickNum(raw, 'price'),
    minimumPrice: pickNum(raw, 'minimumPrice', 'minimum_price'),
    maximumPrice: pickNum(raw, 'maximumPrice', 'maximum_price'),
    estimatedDurationMinutes: pickNum(raw, 'estimatedDurationMinutes', 'estimated_duration_minutes'),
    requiresAppointment: pickBool(raw, 'requiresAppointment', 'requires_appointment'),
    requiresVehicle: pickBool(raw, 'requiresVehicle', 'requires_vehicle'),
    images: Array.isArray(raw.images) ? raw.images.map((i) => mapPublicImage(i as Record<string, unknown>)) : [],
  }
}

export function mapPublicProduct(raw: Record<string, unknown>): PublicProduct {
  const cat = (raw.category ?? raw.productCategory) as Record<string, unknown> | undefined
  return {
    id: String(raw.id),
    slug: String(raw.slug),
    name: String(raw.name),
    description: pick(raw, 'description') as string | undefined,
    category: cat ? mapCategoryRef(cat) : { id: '', code: '', name: 'General' },
    price: pickNum(raw, 'price'),
    salePrice: pickNum(raw, 'salePrice', 'sale_price'),
    stockStatus: pick(raw, 'stockStatus', 'stock_status') as string | undefined,
    images: Array.isArray(raw.images) ? raw.images.map((i) => mapPublicImage(i as Record<string, unknown>)) : [],
  }
}

export function mapFavorite(raw: Record<string, unknown>): FavoriteBusiness {
  const biz = raw.business as Record<string, unknown> | undefined
  return {
    favoriteId: String(pick(raw, 'favoriteId', 'favorite_id', 'id') ?? raw.id),
    businessId: String(pick(raw, 'businessId', 'business_id') ?? biz?.id ?? ''),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    business: biz ? mapBusiness(biz) : undefined,
  }
}

export function mapBusiness(raw: Record<string, unknown>): DiscoveryBusiness {
  return {
    id: String(raw.id),
    slug: String(raw.slug),
    displayName: String(raw.displayName ?? raw.display_name),
    description: (raw.description as string) ?? undefined,
    logoPath: (raw.logoPath ?? raw.logo_path) as string | undefined,
    coverPath: (raw.coverPath ?? raw.cover_path) as string | undefined,
    businessCategoryId: String(raw.businessCategoryId ?? raw.business_category_id),
    verificationStatus: String(raw.verificationStatus ?? raw.verification_status),
    averageRating: Number(raw.averageRating ?? raw.average_rating ?? 0),
    ratingCount: Number(raw.ratingCount ?? raw.rating_count ?? 0),
    areas: Array.isArray(raw.areas) ? raw.areas.map(String) : [],
    branches: Array.isArray(raw.branches)
      ? raw.branches.map((b) => {
          const br = b as Record<string, unknown>
          return {
            id: String(br.id),
            name: String(br.name),
            phone: br.phone as string | undefined,
            addressLine: String(br.addressLine ?? br.address_line),
            area: br.area as string | undefined,
            city: br.city as string | undefined,
            countryCode: String(br.countryCode ?? br.country_code ?? 'BH'),
            latitude: br.latitude != null ? Number(br.latitude) : undefined,
            longitude: br.longitude != null ? Number(br.longitude) : undefined,
            timezone: String(br.timezone ?? 'Asia/Bahrain'),
            isPrimary: Boolean(br.isPrimary ?? br.is_primary),
          }
        })
      : [],
    openingState: raw.openingState ?? raw.opening_state
      ? (() => {
          const o = (raw.openingState ?? raw.opening_state) as Record<string, unknown>
          return {
            isOpen: Boolean(o.isOpen ?? o.is_open),
            branchId: o.branchId as string | undefined,
            branchName: o.branchName as string | undefined,
          }
        })()
      : undefined,
    serviceCount: Number(raw.serviceCount ?? raw.service_count ?? 0),
    productCount: Number(raw.productCount ?? raw.product_count ?? 0),
    distanceKm: raw.distanceKm != null ? Number(raw.distanceKm ?? raw.distance_km) : undefined,
  }
}

function mapServiceLine(raw: Record<string, unknown>): AppointmentServiceLine {
  return {
    id: String(raw.id),
    serviceId: String(pick(raw, 'serviceId', 'service_id') ?? ''),
    serviceName: String(pick(raw, 'serviceName', 'service_name') ?? 'Service'),
    estimatedDurationMinutes: pickNum(raw, 'estimatedDurationMinutes', 'estimated_duration_minutes') ?? 0,
    quotedPrice: pickNum(raw, 'quotedPrice', 'quoted_price'),
  }
}

export function mapAppointment(raw: Record<string, unknown>): Appointment {
  const customerRaw = (raw.customer ?? raw.customerProfile) as Record<string, unknown> | undefined
  const vehicleRaw = raw.vehicle as Record<string, unknown> | undefined
  const quotationRaw = raw.quotation as Record<string, unknown> | undefined
  const invoiceRaw = raw.invoice as Record<string, unknown> | undefined
  const mediaRaw = (raw.media ?? raw.photos) as unknown

  const mapHistory = (list: Record<string, unknown>[]) =>
    list.map((h) => ({
      status: String(h.toStatus ?? h.to_status ?? h.status),
      changedAt: String(h.createdAt ?? h.created_at ?? ''),
      note: (h.note ?? h.reason) as string | undefined,
    }))

  return {
    id: String(raw.id),
    customerId: pick(raw, 'customerId', 'customer_id') as string | undefined,
    businessId: String(pick(raw, 'businessId', 'business_id') ?? ''),
    branchId: String(pick(raw, 'branchId', 'branch_id') ?? ''),
    vehicleId: pick(raw, 'vehicleId', 'vehicle_id') as string | undefined,
    status: String(raw.status),
    scheduledStart: String(pick(raw, 'scheduledStart', 'scheduled_start') ?? ''),
    scheduledEnd: String(pick(raw, 'scheduledEnd', 'scheduled_end') ?? ''),
    customerNotes: pick(raw, 'customerNotes', 'customer_notes') as string | undefined,
    businessNotes: pick(raw, 'businessNotes', 'business_notes') as string | undefined,
    cancellationReason: pick(raw, 'cancellationReason', 'cancellation_reason') as string | undefined,
    businessName: pick(raw, 'businessName', 'business_name') as string | undefined,
    branchName: pick(raw, 'branchName', 'branch_name') as string | undefined,
    confirmedAt: (pick(raw, 'confirmedAt', 'confirmed_at') as string | null | undefined) ?? null,
    arrivedAt: (pick(raw, 'arrivedAt', 'arrived_at') as string | null | undefined) ?? null,
    startedAt: (pick(raw, 'startedAt', 'started_at') as string | null | undefined) ?? null,
    completedAt: (pick(raw, 'completedAt', 'completed_at') as string | null | undefined) ?? null,
    quotationId: pick(raw, 'quotationId', 'quotation_id') as string | undefined,
    invoiceId: pick(raw, 'invoiceId', 'invoice_id') as string | undefined,
    services: Array.isArray(raw.services)
      ? raw.services.map((s) => mapServiceLine(s as Record<string, unknown>))
      : [],
    statusHistory: Array.isArray(raw.statusHistory)
      ? mapHistory(raw.statusHistory as Record<string, unknown>[])
      : Array.isArray(raw.status_history)
        ? mapHistory(raw.status_history as Record<string, unknown>[])
        : undefined,
    customer: customerRaw
      ? {
          id: customerRaw.id != null ? String(customerRaw.id) : undefined,
          fullName: pick(customerRaw, 'fullName', 'full_name') as string | undefined,
          phone: customerRaw.phone as string | undefined,
          email: customerRaw.email as string | undefined,
        }
      : undefined,
    vehicle: vehicleRaw
      ? {
          id: vehicleRaw.id != null ? String(vehicleRaw.id) : undefined,
          displayLabel: pick(vehicleRaw, 'displayLabel', 'display_label') as string | undefined,
          makeText: pick(vehicleRaw, 'makeText', 'make_text') as string | undefined,
          modelText: pick(vehicleRaw, 'modelText', 'model_text') as string | undefined,
          year: pickNum(vehicleRaw, 'year'),
          plateNumber: pick(vehicleRaw, 'plateNumber', 'plate_number') as string | undefined,
          vin: vehicleRaw.vin as string | undefined,
        }
      : undefined,
    quotation: quotationRaw
      ? {
          id: String(quotationRaw.id),
          number: pick(quotationRaw, 'quotationNumber', 'quotation_number') as string | undefined,
          status: String(quotationRaw.status ?? ''),
          grandTotal: pickNum(quotationRaw, 'grandTotal', 'grand_total'),
          currency: pick(quotationRaw, 'currency') as string | undefined,
        }
      : undefined,
    invoice: invoiceRaw
      ? {
          id: String(invoiceRaw.id),
          number: pick(invoiceRaw, 'invoiceNumber', 'invoice_number') as string | undefined,
          status: String(invoiceRaw.status ?? ''),
          grandTotal: pickNum(invoiceRaw, 'grandTotal', 'grand_total'),
          currency: pick(invoiceRaw, 'currency') as string | undefined,
        }
      : undefined,
    media: Array.isArray(mediaRaw)
      ? (mediaRaw as Record<string, unknown>[]).map((m) => ({
          id: String(m.id),
          phase: String(m.phase ?? 'during'),
          storagePath: String(pick(m, 'storagePath', 'storage_path') ?? ''),
          caption: (m.caption as string | null) ?? null,
          sortOrder: pickNum(m, 'sortOrder', 'sort_order'),
          createdAt: pick(m, 'createdAt', 'created_at') as string | undefined,
        }))
      : undefined,
  }
}

export function mapAppointmentSlots(raw: Record<string, unknown>): AppointmentSlotsResult {
  return {
    date: String(raw.date),
    durationMinutes: pickNum(raw, 'durationMinutes', 'duration_minutes') ?? 60,
    slots: Array.isArray(raw.slots)
      ? (raw.slots as Record<string, unknown>[]).map(
          (s): AppointmentSlot => ({
            start: String(s.start),
            end: String(s.end),
          }),
        )
      : [],
  }
}

function mapLineItem(raw: Record<string, unknown>): LineItem {
  return {
    id: String(raw.id),
    description: String(pick(raw, 'description', 'name') ?? 'Item'),
    quantity: pickNum(raw, 'quantity') ?? 1,
    unitPrice: pickNum(raw, 'unitPrice', 'unit_price') ?? 0,
    lineTotal: pickNum(raw, 'lineTotal', 'line_total') ?? 0,
  }
}

export function mapInvoice(raw: Record<string, unknown>): Invoice {
  return {
    id: String(raw.id),
    invoiceNumber: String(pick(raw, 'invoiceNumber', 'invoice_number') ?? ''),
    status: String(raw.status),
    businessId: String(pick(raw, 'businessId', 'business_id') ?? ''),
    businessName: pick(raw, 'businessName', 'business_name') as string | undefined,
    grandTotal: pickNum(raw, 'grandTotal', 'grand_total') ?? 0,
    remainingTotal: pickNum(raw, 'remainingTotal', 'remaining_total') ?? 0,
    currency: String(pick(raw, 'currency') ?? 'BHD'),
    requiresCustomerApproval: pickBool(raw, 'requiresCustomerApproval', 'requires_customer_approval'),
    items: Array.isArray(raw.items) ? raw.items.map((i) => mapLineItem(i as Record<string, unknown>)) : [],
    issuedAt: pick(raw, 'issuedAt', 'issued_at') as string | undefined,
    dueAt: pick(raw, 'dueAt', 'due_at') as string | undefined,
    cashPaymentsEnabled: pickBool(raw, 'cashPaymentsEnabled', 'cash_payments_enabled') || undefined,
    benefitPayEnabled: pickBool(raw, 'benefitPayEnabled', 'benefit_pay_enabled') || undefined,
    benefitPayPhone: (pick(raw, 'benefitPayPhone', 'benefit_pay_phone') as string | null) ?? null,
    benefitPayIban: (pick(raw, 'benefitPayIban', 'benefit_pay_iban') as string | null) ?? null,
    benefitPayInstructions:
      (pick(raw, 'benefitPayInstructions', 'benefit_pay_instructions') as string | null) ?? null,
  }
}

export function mapPayment(raw: Record<string, unknown>): Payment {
  return {
    id: String(raw.id),
    paymentReference: String(pick(raw, 'paymentReference', 'payment_reference') ?? ''),
    amount: pickNum(raw, 'amount') ?? 0,
    method: String(pick(raw, 'method', 'paymentMethod', 'payment_method') ?? ''),
    status: String(raw.status),
    paidAt: pick(raw, 'paidAt', 'paid_at') as string | undefined,
  }
}

export function mapQuotation(raw: Record<string, unknown>): Quotation {
  return {
    id: String(raw.id),
    quotationNumber: String(pick(raw, 'quotationNumber', 'quotation_number') ?? ''),
    status: String(raw.status),
    businessId: String(pick(raw, 'businessId', 'business_id') ?? ''),
    businessName: pick(raw, 'businessName', 'business_name') as string | undefined,
    grandTotal: pickNum(raw, 'grandTotal', 'grand_total') ?? 0,
    currency: String(pick(raw, 'currency') ?? 'BHD'),
    items: Array.isArray(raw.items) ? raw.items.map((i) => mapLineItem(i as Record<string, unknown>)) : [],
    validUntil: pick(raw, 'validUntil', 'valid_until') as string | undefined,
  }
}

function mapRatings(raw: Record<string, unknown> | undefined): ReviewRatingDimensions {
  const r = raw ?? {}
  return {
    workQuality: pickNum(r, 'workQuality', 'work_quality') ?? 0,
    pricingTransparency: pickNum(r, 'pricingTransparency', 'pricing_transparency') ?? 0,
    timeliness: pickNum(r, 'timeliness') ?? 0,
    customerService: pickNum(r, 'customerService', 'customer_service') ?? 0,
    overallExperience: pickNum(r, 'overallExperience', 'overall_experience') ?? 0,
  }
}

export function mapReviewEligibility(raw: Record<string, unknown>): ReviewEligibility {
  return {
    id: String(raw.id),
    businessId: String(pick(raw, 'businessId', 'business_id') ?? ''),
    businessName: pick(raw, 'businessName', 'business_name') as string | undefined,
    verificationType: String(pick(raw, 'verificationType', 'verification_type') ?? ''),
    isUsed: pickBool(raw, 'isUsed', 'is_used'),
    contextLabel: pick(raw, 'contextLabel', 'context_label') as string | undefined,
  }
}

export function mapReview(raw: Record<string, unknown>): Review {
  const resp = raw.response as Record<string, unknown> | undefined
  return {
    id: String(raw.id),
    businessId: String(pick(raw, 'businessId', 'business_id') ?? ''),
    businessName: pick(raw, 'businessName', 'business_name') as string | undefined,
    overallRating: pickNum(raw, 'overallRating', 'overall_rating') ?? 0,
    ratings: mapRatings((raw.ratings ?? raw.reviewRatings) as Record<string, unknown>),
    comment: pick(raw, 'comment') as string | undefined,
    status: String(raw.status),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    response: resp
      ? {
          id: String(resp.id),
          message: String(resp.message ?? resp.responseText ?? resp.response_text ?? ''),
          respondedAt: String(pick(resp, 'respondedAt', 'responded_at', 'createdAt', 'created_at') ?? ''),
        }
      : undefined,
    appointmentId: pick(raw, 'appointmentId', 'appointment_id') as string | undefined,
    vehicleLabel: pick(raw, 'vehicleLabel', 'vehicle_label') as string | undefined,
    serviceLabel: pick(raw, 'serviceLabel', 'service_label') as string | undefined,
    contextLabel: pick(raw, 'contextLabel', 'context_label') as string | undefined,
  }
}

export function mapDisputeMessage(raw: Record<string, unknown>): DisputeMessage {
  return {
    id: String(raw.id),
    senderUserId: String(pick(raw, 'senderUserId', 'sender_user_id') ?? ''),
    message: String(raw.message ?? raw.body ?? ''),
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    isFromCustomer: pickBool(raw, 'isFromCustomer', 'is_from_customer'),
  }
}

export function mapDisputeEvidence(raw: Record<string, unknown>): DisputeEvidence {
  return {
    id: String(raw.id),
    storagePath: String(pick(raw, 'storagePath', 'storage_path') ?? ''),
    originalFileName: String(pick(raw, 'originalFileName', 'original_file_name') ?? ''),
    mimeType: String(pick(raw, 'mimeType', 'mime_type') ?? ''),
    uploadedAt: String(pick(raw, 'uploadedAt', 'uploaded_at', 'createdAt', 'created_at') ?? ''),
  }
}

export function mapDispute(raw: Record<string, unknown>): Dispute {
  return {
    id: String(raw.id),
    disputeNumber: String(pick(raw, 'disputeNumber', 'dispute_number') ?? ''),
    businessId: String(pick(raw, 'businessId', 'business_id') ?? ''),
    businessName: pick(raw, 'businessName', 'business_name') as string | undefined,
    customerId: String(pick(raw, 'customerId', 'customer_id') ?? ''),
    reasonCode: String(pick(raw, 'reasonCode', 'reason_code') ?? ''),
    summary: String(raw.summary ?? ''),
    description: pick(raw, 'description') as string | undefined,
    status: String(raw.status),
    appointmentId: pick(raw, 'appointmentId', 'appointment_id') as string | undefined,
    quotationId: pick(raw, 'quotationId', 'quotation_id') as string | undefined,
    invoiceId: pick(raw, 'invoiceId', 'invoice_id') as string | undefined,
    paymentId: pick(raw, 'paymentId', 'payment_id') as string | undefined,
    reviewId: pick(raw, 'reviewId', 'review_id') as string | undefined,
    messages: Array.isArray(raw.messages)
      ? raw.messages.map((m) => mapDisputeMessage(m as Record<string, unknown>))
      : [],
    evidence: Array.isArray(raw.evidence)
      ? raw.evidence.map((e) => mapDisputeEvidence(e as Record<string, unknown>))
      : [],
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
  }
}

export function mapVehicle(raw: Record<string, unknown>): Vehicle {
  const makeText = pick<string>(raw, 'makeText', 'make_text')
  const modelText = pick<string>(raw, 'modelText', 'model_text')
  const year = pickNum(raw, 'year') ?? 0
  return {
    id: String(raw.id),
    customerId: pick(raw, 'customerId', 'customer_id') as string | undefined,
    makeId: String(pick(raw, 'makeId', 'make_id') ?? ''),
    modelId: String(pick(raw, 'modelId', 'model_id') ?? ''),
    makeText,
    modelText,
    year,
    trim: pick(raw, 'trim') as string | undefined,
    engine: pick(raw, 'engine') as string | undefined,
    vin: pick(raw, 'vin') as string | undefined,
    plateNumber: pick(raw, 'plateNumber', 'plate_number', 'registrationNumber', 'registration_number') as
      | string
      | undefined,
    color: pick(raw, 'color') as string | undefined,
    mileage: pickNum(raw, 'mileage'),
    mileageUnit: String(pick(raw, 'mileageUnit', 'mileage_unit') ?? 'km'),
    imagePath: pick(raw, 'imagePath', 'image_path') as string | undefined,
    isDefault: pickBool(raw, 'isDefault', 'is_default'),
    isActive: pickBool(raw, 'isActive', 'is_active') || raw.isActive === undefined,
    displayLabel: pick(raw, 'displayLabel', 'display_label') as string | undefined,
    confirmationStatus: (pick(raw, 'confirmationStatus', 'confirmation_status') as string) ??
      'confirmed',
    createdByBusinessId:
      (pick(raw, 'createdByBusinessId', 'created_by_business_id') as string | null) ?? null,
    sourceAppointmentId:
      (pick(raw, 'sourceAppointmentId', 'source_appointment_id') as string | null) ?? null,
    vehicleType: pick(raw, 'vehicleType', 'vehicle_type', 'bodyType', 'body_type') as
      | string
      | undefined,
    bodyType: pick(raw, 'bodyType', 'body_type', 'vehicleType', 'vehicle_type') as
      | string
      | undefined,
    fuelType: pick(raw, 'fuelType', 'fuel_type') as string | undefined,
    transmission: pick(raw, 'transmission') as string | undefined,
    verificationStatus: pick(raw, 'verificationStatus', 'verification_status') as
      | string
      | undefined,
    ownerName: pick(raw, 'ownerName', 'owner_name', 'customerName', 'customer_name') as
      | string
      | undefined,
    ownerEmail: pick(raw, 'ownerEmail', 'owner_email', 'customerEmail', 'customer_email') as
      | string
      | undefined,
  }
}

export function mapVehicleMake(raw: Record<string, unknown>): VehicleMake {
  return { id: String(raw.id), name: String(raw.name), slug: String(raw.slug) }
}

export function mapVehicleModel(raw: Record<string, unknown>): VehicleModel {
  return {
    id: String(raw.id),
    makeId: String(pick(raw, 'makeId', 'make_id') ?? ''),
    name: String(raw.name),
    slug: String(raw.slug),
  }
}

export function mapProfile(raw: Record<string, unknown>): Profile {
  return {
    id: String(raw.id),
    fullName: (pick(raw, 'fullName', 'full_name') as string | null) ?? null,
    phone: (raw.phone as string | null) ?? null,
    locale: (pick(raw, 'locale', 'preferredLanguage', 'preferred_language') as string | null) ?? null,
    isSuspended: pickBool(raw, 'isSuspended', 'is_suspended'),
    avatarPath: pick(raw, 'avatarPath', 'avatar_path') as string | undefined,
    preferredLanguage: pick(raw, 'preferredLanguage', 'preferred_language') as string | undefined,
  }
}

function mapProductOrderItem(raw: Record<string, unknown>): ProductOrderItem {
  return {
    id: String(raw.id),
    productId: (pick(raw, 'productId', 'product_id') as string | null) ?? null,
    productName: String(pick(raw, 'productName', 'product_name', 'productNameSnapshot') ?? ''),
    sku: (pick(raw, 'sku', 'skuSnapshot') as string | null) ?? null,
    quantity: pickNum(raw, 'quantity') ?? 0,
    unitPrice: pickNum(raw, 'unitPrice', 'unit_price') ?? 0,
    discountAmount: pickNum(raw, 'discountAmount', 'discount_amount') ?? 0,
    taxAmount: pickNum(raw, 'taxAmount', 'tax_amount') ?? 0,
    lineTotal: pickNum(raw, 'lineTotal', 'line_total') ?? 0,
    sortOrder: pickNum(raw, 'sortOrder', 'sort_order') ?? 0,
  }
}

export function mapProductOrder(raw: Record<string, unknown>): ProductOrder {
  const itemsRaw = raw.items
  return {
    id: String(raw.id),
    orderNumber: String(pick(raw, 'orderNumber', 'order_number') ?? ''),
    customerId: String(pick(raw, 'customerId', 'customer_id') ?? ''),
    businessId: String(pick(raw, 'businessId', 'business_id') ?? ''),
    branchId: (pick(raw, 'branchId', 'branch_id') as string | null) ?? null,
    status: String(raw.status ?? 'created'),
    fulfillmentMethod: String(pick(raw, 'fulfillmentMethod', 'fulfillment_method') ?? 'pickup'),
    subtotal: pickNum(raw, 'subtotal') ?? 0,
    discountTotal: pickNum(raw, 'discountTotal', 'discount_total') ?? 0,
    taxTotal: pickNum(raw, 'taxTotal', 'tax_total') ?? 0,
    grandTotal: pickNum(raw, 'grandTotal', 'grand_total') ?? 0,
    currency: String(raw.currency ?? 'BHD'),
    customerNotes: (pick(raw, 'customerNotes', 'customer_notes') as string | null) ?? null,
    businessNotes: (pick(raw, 'businessNotes', 'business_notes') as string | null) ?? null,
    deliveryAddress: (pick(raw, 'deliveryAddress', 'delivery_address') as string | null) ?? null,
    cancelledAt: (pick(raw, 'cancelledAt', 'cancelled_at') as string | null) ?? null,
    completedAt: (pick(raw, 'completedAt', 'completed_at') as string | null) ?? null,
    createdAt: String(pick(raw, 'createdAt', 'created_at') ?? ''),
    updatedAt: String(pick(raw, 'updatedAt', 'updated_at') ?? ''),
    items: Array.isArray(itemsRaw)
      ? itemsRaw.map((i) => mapProductOrderItem(i as Record<string, unknown>))
      : [],
  }
}
