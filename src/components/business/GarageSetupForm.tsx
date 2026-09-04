import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { evaluateSetupChecklist } from '../../lib/garageSetup'
import { directionsOptions } from '../../lib/mapsLinks'
import {
  createBusinessService,
  deactivateBusinessService,
  getBusinessDashboard,
  getBusinessSettings,
  getOpeningHours,
  listBusinessBranches,
  listBusinessServices,
  replaceOpeningHours,
  updateBusinessBranch,
  updateBusinessProfile,
  updateBusinessSettings,
} from '../../services/api/business'
import { listServiceCategories } from '../../services/api/catalog'
import type { CreateServiceInput, OpeningHoursDay, ServicePricingType } from '../../types/onboarding'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { LocationPicker } from '../ui/LocationPicker'
import { Spinner } from '../ui/Spinner'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function defaultSchedule(): OpeningHoursDay[] {
  return DAY_LABELS.map((_, dayOfWeek) =>
    dayOfWeek === 5
      ? { dayOfWeek, isClosed: true }
      : { dayOfWeek, isClosed: false, opensAt: '09:00', closesAt: '18:00' },
  )
}

type Props = {
  businessId: string
  backTo: string
  requireComplete?: boolean
}

export function GarageSetupForm({ businessId, backTo, requireComplete = false }: Props) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const businessQuery = useQuery({
    queryKey: ['business-profile', businessId],
    queryFn: () => getBusinessDashboard(businessId),
  })
  const branchesQuery = useQuery({
    queryKey: ['business-branches', businessId],
    queryFn: () => listBusinessBranches(businessId),
  })
  const settingsQuery = useQuery({
    queryKey: ['business-settings', businessId],
    queryFn: () => getBusinessSettings(businessId),
  })
  const hoursQuery = useQuery({
    queryKey: ['business-hours', businessId],
    queryFn: () => getOpeningHours(businessId),
  })
  const servicesQuery = useQuery({
    queryKey: ['business-services', businessId],
    queryFn: () => listBusinessServices(businessId),
  })
  const categoriesQuery = useQuery({
    queryKey: ['service-categories'],
    queryFn: listServiceCategories,
  })

  const primaryBranch =
    branchesQuery.data?.find((b) => b.isPrimary) ?? branchesQuery.data?.[0] ?? null

  const checklist = useMemo(
    () =>
      evaluateSetupChecklist({
        branch: primaryBranch,
        hours: hoursQuery.data ?? [],
        services: servicesQuery.data ?? [],
        settings: settingsQuery.data,
      }),
    [primaryBranch, hoursQuery.data, servicesQuery.data, settingsQuery.data],
  )

  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [schedule, setSchedule] = useState<OpeningHoursDay[]>(defaultSchedule)
  const [serviceName, setServiceName] = useState('')
  const [serviceCategoryId, setServiceCategoryId] = useState('')
  const [pricingType, setPricingType] = useState<ServicePricingType>('fixed')
  const [price, setPrice] = useState('25')
  const [duration, setDuration] = useState('60')
  const [benefitPayEnabled, setBenefitPayEnabled] = useState(false)
  const [benefitPayPhone, setBenefitPayPhone] = useState('')
  const [benefitPayIban, setBenefitPayIban] = useState('')
  const [benefitPayInstructions, setBenefitPayInstructions] = useState('')

  useEffect(() => {
    const b = businessQuery.data
    if (!b) return
    setDisplayName(b.displayName ?? '')
    setDescription(b.description ?? '')
    setPhone(b.phone ?? '')
    setEmail(b.email ?? '')
  }, [businessQuery.data])

  useEffect(() => {
    if (!primaryBranch) return
    setAddressLine(primaryBranch.addressLine ?? '')
    setArea(primaryBranch.area ?? '')
    setCity(primaryBranch.city ?? '')
    setLatitude(primaryBranch.latitude)
    setLongitude(primaryBranch.longitude)
  }, [primaryBranch])

  useEffect(() => {
    if (!hoursQuery.data) return
    setSchedule(hoursQuery.data.length ? hoursQuery.data : defaultSchedule())
  }, [hoursQuery.data])

  useEffect(() => {
    const s = settingsQuery.data
    if (!s) return
    setBenefitPayEnabled(Boolean(s.benefitPayEnabled))
    setBenefitPayPhone(s.benefitPayPhone ?? '')
    setBenefitPayIban(s.benefitPayIban ?? '')
    setBenefitPayInstructions(s.benefitPayInstructions ?? '')
  }, [settingsQuery.data])

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['business-profile', businessId] })
    void queryClient.invalidateQueries({ queryKey: ['business-branches', businessId] })
    void queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] })
    void queryClient.invalidateQueries({ queryKey: ['business-hours', businessId] })
    void queryClient.invalidateQueries({ queryKey: ['business-services', businessId] })
    void queryClient.invalidateQueries({ queryKey: ['garage-setup', businessId] })
  }

  const profileMutation = useMutation({
    mutationFn: () =>
      updateBusinessProfile(businessId, {
        displayName: displayName.trim(),
        description: description.trim() || null,
        phone: phone.trim(),
        email: email.trim(),
      }),
    onSuccess: () => {
      setSuccess('Profile saved.')
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const branchMutation = useMutation({
    mutationFn: async () => {
      if (!primaryBranch) throw new Error('No branch found for this garage.')
      if (!addressLine.trim()) throw new Error('Address is required.')
      if (latitude == null || longitude == null) throw new Error('Set the map pin for your location.')
      return updateBusinessBranch(businessId, primaryBranch.id, {
        addressLine: addressLine.trim(),
        area: area.trim() || null,
        city: city.trim() || null,
        countryCode: 'BH',
        latitude,
        longitude,
        timezone: 'Asia/Bahrain',
      })
    },
    onSuccess: () => {
      setSuccess('Location saved.')
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const hoursMutation = useMutation({
    mutationFn: () =>
      replaceOpeningHours(
        businessId,
        schedule.map((d) =>
          d.isClosed
            ? { dayOfWeek: d.dayOfWeek, isClosed: true }
            : {
                dayOfWeek: d.dayOfWeek,
                isClosed: false,
                opensAt: (d.opensAt ?? '09:00').slice(0, 5),
                closesAt: (d.closesAt ?? '18:00').slice(0, 5),
              },
        ),
        null,
      ),
    onSuccess: () => {
      setSuccess('Opening hours saved.')
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const serviceMutation = useMutation({
    mutationFn: () => {
      const input: CreateServiceInput = {
        categoryId: serviceCategoryId,
        name: serviceName.trim(),
        pricingType,
        estimatedDurationMinutes: Number(duration) || null,
        requiresAppointment: true,
        requiresVehicle: true,
      }
      if (pricingType === 'fixed') input.price = Number(price)
      if (pricingType === 'starting_from') input.minimumPrice = Number(price)
      if (pricingType === 'range') {
        input.minimumPrice = Number(price)
        input.maximumPrice = Number(price) * 1.5
      }
      return createBusinessService(businessId, input)
    },
    onSuccess: () => {
      setServiceName('')
      setSuccess('Service added.')
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: (serviceId: string) => deactivateBusinessService(businessId, serviceId),
    onSuccess: () => {
      setSuccess('Service deactivated.')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const bookingsMutation = useMutation({
    mutationFn: () =>
      updateBusinessSettings(businessId, {
        appointmentsEnabled: true,
        defaultAppointmentDurationMinutes: 60,
        minimumBookingNoticeMinutes: 60,
        maximumBookingDaysAhead: 30,
        timezone: 'Asia/Bahrain',
        currency: 'BHD',
        locale: 'en',
      }),
    onSuccess: () => {
      setSuccess('Bookings enabled.')
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const benefitPayMutation = useMutation({
    mutationFn: () =>
      updateBusinessSettings(businessId, {
        benefitPayEnabled,
        benefitPayPhone: benefitPayPhone.trim() || null,
        benefitPayIban: benefitPayIban.trim() || null,
        benefitPayInstructions: benefitPayInstructions.trim() || null,
      }),
    onSuccess: () => {
      setSuccess('BenefitPay settings saved.')
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const loading =
    businessQuery.isLoading ||
    branchesQuery.isLoading ||
    settingsQuery.isLoading ||
    hoursQuery.isLoading ||
    servicesQuery.isLoading

  if (loading) return <Spinner />

  const mapPreview =
    latitude != null && longitude != null
      ? directionsOptions({ latitude, longitude, label: displayName || 'Garage' })
      : []

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-4">
      <div>
        <Link to={backTo} className="text-sm text-primary">
          ← Back
        </Link>
        <h2 className="mt-2 text-xl font-semibold text-text-primary">Garage setup</h2>
        <p className="mt-1 text-sm text-text-muted">
          {requireComplete
            ? 'Complete every item below before customers can book.'
            : 'Configure this garage. Changes apply immediately.'}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2 text-xs">
        {(
          [
            ['Location pin', checklist.hasLocation],
            ['Opening hours', checklist.hasHours],
            ['Active service', checklist.hasService],
            ['Bookings on', checklist.appointmentsEnabled],
          ] as const
        ).map(([label, ok]) => (
          <li
            key={label}
            className={`rounded-lg border px-3 py-2 ${ok ? 'border-success/40 bg-success/10 text-success' : 'border-border bg-surface text-text-muted'}`}
          >
            {ok ? '✓' : '○'} {label}
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h3 className="font-semibold">1. Profile</h3>
        <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-text-primary">Description</span>
          <textarea
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <Button loading={profileMutation.isPending} onClick={() => profileMutation.mutate()}>
          Save profile
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h3 className="font-semibold">2. Location</h3>
        <Input label="Address" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
        <Input label="Area" value={area} onChange={(e) => setArea(e.target.value)} />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <LocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={({ latitude: lat, longitude: lng }) => {
            setLatitude(lat)
            setLongitude(lng)
          }}
        />
        {mapPreview[0] && (
          <a href={mapPreview[0].href} target="_blank" rel="noreferrer" className="text-sm text-primary">
            Preview in Google Maps
          </a>
        )}
        <Button loading={branchMutation.isPending} onClick={() => branchMutation.mutate()}>
          Save location
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h3 className="font-semibold">3. Opening hours</h3>
        <div className="space-y-2">
          {schedule.map((day) => (
            <div key={day.dayOfWeek} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="w-10 font-medium">{DAY_LABELS[day.dayOfWeek]}</span>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={day.isClosed}
                  onChange={(e) => {
                    const next = [...schedule]
                    const i = next.findIndex((d) => d.dayOfWeek === day.dayOfWeek)
                    next[i] = e.target.checked
                      ? { dayOfWeek: day.dayOfWeek, isClosed: true }
                      : {
                          dayOfWeek: day.dayOfWeek,
                          isClosed: false,
                          opensAt: '09:00',
                          closesAt: '18:00',
                        }
                    setSchedule(next)
                  }}
                />
                Closed
              </label>
              {!day.isClosed && (
                <>
                  <input
                    type="time"
                    className="rounded-lg border border-border px-2 py-1"
                    value={(day.opensAt ?? '09:00').slice(0, 5)}
                    onChange={(e) => {
                      const next = [...schedule]
                      const i = next.findIndex((d) => d.dayOfWeek === day.dayOfWeek)
                      next[i] = { ...next[i], opensAt: e.target.value }
                      setSchedule(next)
                    }}
                  />
                  <span>–</span>
                  <input
                    type="time"
                    className="rounded-lg border border-border px-2 py-1"
                    value={(day.closesAt ?? '18:00').slice(0, 5)}
                    onChange={(e) => {
                      const next = [...schedule]
                      const i = next.findIndex((d) => d.dayOfWeek === day.dayOfWeek)
                      next[i] = { ...next[i], closesAt: e.target.value }
                      setSchedule(next)
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
        <Button loading={hoursMutation.isPending} onClick={() => hoursMutation.mutate()}>
          Save hours
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h3 className="font-semibold">4. Services</h3>
        <ul className="space-y-2 text-sm">
          {(servicesQuery.data ?? []).filter((s) => s.isActive !== false).length === 0 && (
            <li className="text-text-muted">No active services yet.</li>
          )}
          {(servicesQuery.data ?? [])
            .filter((s) => s.isActive !== false)
            .map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <span>
                  {s.name}{' '}
                  <span className="text-text-muted">
                    ({s.pricingType}
                    {s.price != null ? ` · ${s.price}` : ''})
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs text-error"
                  onClick={() => deactivateMutation.mutate(s.id)}
                >
                  Remove
                </button>
              </li>
            ))}
        </ul>
        <Input label="Service name" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Category</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={serviceCategoryId}
            onChange={(e) => setServiceCategoryId(e.target.value)}
          >
            <option value="">Select…</option>
            {(categoriesQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Pricing</span>
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value as ServicePricingType)}
          >
            <option value="fixed">Fixed</option>
            <option value="starting_from">Starting from</option>
            <option value="range">Range</option>
            <option value="quote_required">Quote required</option>
            <option value="free">Free</option>
          </select>
        </label>
        {pricingType !== 'quote_required' && pricingType !== 'free' && (
          <Input label="Price (BHD)" value={price} onChange={(e) => setPrice(e.target.value)} />
        )}
        <Input
          label="Duration (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <Button
          loading={serviceMutation.isPending}
          disabled={!serviceName.trim() || !serviceCategoryId}
          onClick={() => serviceMutation.mutate()}
        >
          Add service
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h3 className="font-semibold">5. Bookings</h3>
        <p className="text-sm text-text-muted">
          Status:{' '}
          {checklist.appointmentsEnabled ? (
            <span className="text-success">Enabled</span>
          ) : (
            <span className="text-warning">Disabled</span>
          )}
        </p>
        <Button
          loading={bookingsMutation.isPending}
          disabled={checklist.appointmentsEnabled}
          onClick={() => bookingsMutation.mutate()}
        >
          {checklist.appointmentsEnabled ? 'Bookings already on' : 'Enable appointments'}
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
        <h3 className="font-semibold">6. BenefitPay</h3>
        <p className="text-sm text-text-muted">
          Show settlement details so customers can pay invoices via BenefitPay.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={benefitPayEnabled}
            onChange={(e) => setBenefitPayEnabled(e.target.checked)}
          />
          Enable BenefitPay
        </label>
        {benefitPayEnabled && (
          <>
            <Input
              label="BenefitPay phone"
              value={benefitPayPhone}
              onChange={(e) => setBenefitPayPhone(e.target.value)}
            />
            <Input
              label="IBAN"
              value={benefitPayIban}
              onChange={(e) => setBenefitPayIban(e.target.value)}
            />
            <label className="block text-sm">
              <span className="mb-1 block text-text-muted">Payment instructions</span>
              <textarea
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                rows={3}
                value={benefitPayInstructions}
                onChange={(e) => setBenefitPayInstructions(e.target.value)}
              />
            </label>
          </>
        )}
        <Button loading={benefitPayMutation.isPending} onClick={() => benefitPayMutation.mutate()}>
          Save BenefitPay settings
        </Button>
      </section>

      {checklist.complete && (
        <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          Setup complete. This garage can appear in discovery and accept bookings.
        </p>
      )}
    </div>
  )
}
