import { describe, expect, it } from 'vitest'
import {
  mapAppointment,
  mapBusiness,
  mapInvoice,
  mapProfile,
  mapPublicService,
  mapQuotation,
  mapReview,
  mapVehicle,
} from '../src/lib/mappers'

describe('mapBusiness', () => {
  it('maps snake_case discovery payload', () => {
    const biz = mapBusiness({
      id: 'b1',
      slug: 'quick-fix',
      display_name: 'Quick Fix',
      business_category_id: 'cat1',
      verification_status: 'verified',
      average_rating: 4.2,
      rating_count: 8,
      branches: [
        {
          id: 'br1',
          name: 'Main',
          address_line: 'Road 1',
          is_primary: true,
          country_code: 'BH',
        },
      ],
    })
    expect(biz.displayName).toBe('Quick Fix')
    expect(biz.verificationStatus).toBe('verified')
    expect(biz.branches[0]?.isPrimary).toBe(true)
  })
})

describe('mapPublicService', () => {
  it('maps service with category and pricing', () => {
    const svc = mapPublicService({
      id: 's1',
      slug: 'oil-change',
      name: 'Oil Change',
      pricing_type: 'fixed',
      price: 15,
      requires_vehicle: true,
      category: { id: 'c1', code: 'maint', name: 'Maintenance' },
    })
    expect(svc.name).toBe('Oil Change')
    expect(svc.requiresVehicle).toBe(true)
    expect(svc.category.name).toBe('Maintenance')
  })
})

describe('mapAppointment', () => {
  it('maps appointment with service lines', () => {
    const appt = mapAppointment({
      id: 'a1',
      business_id: 'b1',
      branch_id: 'br1',
      status: 'confirmed',
      scheduled_start: '2026-02-01T09:00:00Z',
      scheduled_end: '2026-02-01T10:00:00Z',
      services: [{ id: 'l1', service_id: 's1', service_name: 'Oil Change', estimated_duration_minutes: 60 }],
    })
    expect(appt.status).toBe('confirmed')
    expect(appt.services[0]?.serviceName).toBe('Oil Change')
  })
})

describe('mapInvoice', () => {
  it('maps invoice totals and line items', () => {
    const inv = mapInvoice({
      id: 'i1',
      invoice_number: 'INV-001',
      status: 'issued',
      business_id: 'b1',
      grand_total: 50,
      remaining_total: 50,
      items: [{ id: 'li1', description: 'Brake pads', quantity: 1, unit_price: 50, line_total: 50 }],
    })
    expect(inv.invoiceNumber).toBe('INV-001')
    expect(inv.items[0]?.lineTotal).toBe(50)
  })
})

describe('mapQuotation', () => {
  it('maps quotation fields', () => {
    const q = mapQuotation({
      id: 'q1',
      quotation_number: 'Q-001',
      status: 'sent',
      business_id: 'b1',
      grand_total: 120,
    })
    expect(q.quotationNumber).toBe('Q-001')
    expect(q.grandTotal).toBe(120)
  })
})

describe('mapReview', () => {
  it('maps review ratings and response', () => {
    const review = mapReview({
      id: 'r1',
      business_id: 'b1',
      overall_rating: 4.5,
      status: 'published',
      created_at: '2026-01-01T00:00:00Z',
      ratings: { work_quality: 5, timeliness: 4 },
      response: { id: 'resp1', message: 'Thanks!', responded_at: '2026-01-02T00:00:00Z' },
    })
    expect(review.ratings.workQuality).toBe(5)
    expect(review.response?.message).toBe('Thanks!')
  })
})

describe('mapVehicle', () => {
  it('maps vehicle with display label fields', () => {
    const v = mapVehicle({
      id: 'v1',
      make_id: 'm1',
      model_id: 'md1',
      make_text: 'Toyota',
      model_text: 'Camry',
      year: 2020,
      plate_number: '12345',
      is_default: true,
    })
    expect(v.makeText).toBe('Toyota')
    expect(v.isDefault).toBe(true)
    expect(v.plateNumber).toBe('12345')
  })
})

describe('mapProfile', () => {
  it('maps profile with preferred language alias', () => {
    const p = mapProfile({
      id: 'u1',
      full_name: 'Sara Ahmed',
      preferred_language: 'ar',
      is_suspended: false,
    })
    expect(p.fullName).toBe('Sara Ahmed')
    expect(p.preferredLanguage).toBe('ar')
    expect(p.isSuspended).toBe(false)
  })
})
