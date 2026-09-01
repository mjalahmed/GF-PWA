export interface AppointmentServiceLine {
  id: string
  serviceId: string
  serviceName: string
  estimatedDurationMinutes: number
  quotedPrice?: number
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
  services: AppointmentServiceLine[]
  statusHistory?: Array<{ status: string; changedAt: string }>
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
