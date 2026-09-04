export interface AppointmentServiceLine {
  id: string
  serviceId: string
  serviceName: string
  estimatedDurationMinutes: number
  quotedPrice?: number
}

export interface AppointmentCustomer {
  id?: string
  fullName?: string
  phone?: string
  email?: string
}

export interface AppointmentVehicleSummary {
  id?: string
  displayLabel?: string
  makeText?: string
  modelText?: string
  year?: number
  plateNumber?: string
  vin?: string
}

export interface AppointmentCommerceSummary {
  id: string
  number?: string
  status: string
  grandTotal?: number
  currency?: string
}

export interface Appointment {
  id: string
  customerId?: string
  businessId: string
  branchId: string
  vehicleId?: string
  status: string
  scheduledStart: string
  scheduledEnd: string
  customerNotes?: string
  businessNotes?: string
  cancellationReason?: string
  businessName?: string
  branchName?: string
  confirmedAt?: string | null
  arrivedAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  quotationId?: string
  invoiceId?: string
  services: AppointmentServiceLine[]
  statusHistory?: Array<{ status: string; changedAt: string; note?: string }>
  customer?: AppointmentCustomer
  vehicle?: AppointmentVehicleSummary
  quotation?: AppointmentCommerceSummary
  invoice?: AppointmentCommerceSummary
  media?: Array<{
    id: string
    phase: 'before' | 'during' | 'after' | string
    storagePath: string
    caption?: string | null
    sortOrder?: number
    createdAt?: string
  }>
}

export interface AppointmentSlot {
  start: string
  end: string
}

export interface AppointmentSlotsResult {
  date: string
  durationMinutes: number
  slots: AppointmentSlot[]
}

/** Statuses settable via POST /v1/appointments/:id/status */
export const GENERIC_APPOINTMENT_STATUSES = [
  'quote_pending',
  'quote_accepted',
  'waiting',
  'waiting_for_parts',
  'waiting_for_customer',
  'ready_for_pickup',
  'disputed',
] as const

export type GenericAppointmentStatus = (typeof GENERIC_APPOINTMENT_STATUSES)[number]
