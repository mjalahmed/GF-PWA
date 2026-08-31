import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { formatMoney, primaryBranch, vehicleLabel } from '../lib/utils'
import {
  createAppointment,
  listAppointmentSlots,
} from '../services/api/appointments'
import { listPublicServices } from '../services/api/catalog'
import { getBusinessBySlug } from '../services/api/garages'
import { listVehicles } from '../services/api/vehicles'
import type { PublicService } from '../types/catalog'

const STEPS = ['branch', 'service', 'vehicle', 'date', 'slot', 'notes', 'confirm'] as const
type Step = (typeof STEPS)[number]

export function BookAppointmentPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('branch')
  const [branchId, setBranchId] = useState('')
  const [service, setService] = useState<PublicService | null>(null)
  const [vehicleId, setVehicleId] = useState('')
  const [date, setDate] = useState('')
  const [slotStart, setSlotStart] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const garageQuery = useQuery({
    queryKey: ['garage', slug],
    queryFn: () => getBusinessBySlug(slug!),
    enabled: !!slug,
  })

  const garage = garageQuery.data

  const servicesQuery = useQuery({
    queryKey: ['book-services', slug],
    queryFn: () => listPublicServices(slug!, { pageSize: 100 }),
    enabled: !!slug && step !== 'branch',
  })

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles(),
    enabled: step === 'vehicle' || step === 'slot',
  })

  const slotsQuery = useQuery({
    queryKey: ['appointment-slots', garage?.id, branchId, date, service?.id],
    queryFn: () =>
      listAppointmentSlots({
        businessId: garage!.id,
        branchId,
        date,
        serviceId: service!.id,
      }),
    enabled: !!garage && !!branchId && !!date && !!service && step === 'slot',
  })

  const bookMutation = useMutation({
    mutationFn: () =>
      createAppointment({
        businessId: garage!.id,
        branchId,
        serviceId: service!.id,
        scheduledStart: slotStart,
        vehicleId: vehicleId || undefined,
        customerNotes: notes.trim() || undefined,
      }),
    onSuccess: (appt) => navigate(`/appointments/${appt.id}`, { replace: true }),
    onError: (err) => setError(err instanceof Error ? err.message : 'Booking failed'),
  })

  if (garageQuery.isLoading) return <Spinner />
  if (garageQuery.error || !garage) {
    return (
      <div>
        <PageHeader title="Book" backTo="/search" />
        <EmptyState title="Garage not found" actionLabel="Back" onAction={() => navigate('/search')} />
      </div>
    )
  }

  const stepIndex = STEPS.indexOf(step)
  const selectedBranch = garage.branches.find((b) => b.id === branchId) ?? primaryBranch(garage)

  const goNext = () => {
    setError('')
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  const goBack = () => {
    setError('')
    const prev = STEPS[stepIndex - 1]
    if (prev) setStep(prev)
    else navigate(`/garages/${slug}`)
  }

  return (
    <div>
      <PageHeader title="Book appointment" backTo={`/garages/${slug}`} />
      <div className="mx-auto max-w-lg px-4 py-4">
        <p className="mb-4 text-sm text-text-muted">
          Step {stepIndex + 1} of {STEPS.length} · {garage.displayName}
        </p>

        {step === 'branch' && (
          <div className="space-y-2">
            <h2 className="font-semibold text-text-primary">Choose branch</h2>
            {garage.branches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setBranchId(b.id)
                  goNext()
                }}
                className="block w-full rounded-xl border border-border bg-surface p-4 text-left hover:border-primary"
              >
                <p className="font-medium">{b.name}</p>
                <p className="text-sm text-text-muted">{b.addressLine}</p>
              </button>
            ))}
          </div>
        )}

        {step === 'service' && (
          <div className="space-y-2">
            <h2 className="font-semibold text-text-primary">Choose service</h2>
            {servicesQuery.isLoading && <Spinner />}
            {servicesQuery.data?.items.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => {
                  setService(svc)
                  if (svc.requiresVehicle) setStep('vehicle')
                  else {
                    setVehicleId('')
                    setStep('date')
                  }
                }}
                className="block w-full rounded-xl border border-border bg-surface p-4 text-left hover:border-primary"
              >
                <p className="font-medium">{svc.name}</p>
                <p className="text-sm text-text-muted">
                  {svc.price != null ? formatMoney(svc.price) : 'Price on request'}
                  {svc.estimatedDurationMinutes != null && ` · ${svc.estimatedDurationMinutes} min`}
                </p>
              </button>
            ))}
            {servicesQuery.data?.items.length === 0 && (
              <EmptyState title="No bookable services" description="Try another garage." />
            )}
          </div>
        )}

        {step === 'vehicle' && (
          <div className="space-y-2">
            <h2 className="font-semibold text-text-primary">Choose vehicle (optional)</h2>
            <button
              type="button"
              onClick={() => {
                setVehicleId('')
                goNext()
              }}
              className="block w-full rounded-xl border border-border bg-surface p-4 text-left"
            >
              Skip — no vehicle
            </button>
            {vehiclesQuery.data?.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVehicleId(v.id)
                  goNext()
                }}
                className="block w-full rounded-xl border border-border bg-surface p-4 text-left hover:border-primary"
              >
                <p className="font-medium">{vehicleLabel(v)}</p>
                {v.plateNumber && <p className="text-sm text-text-muted">{v.plateNumber}</p>}
              </button>
            ))}
            <Link to="/vehicles/new" className="block text-center text-sm text-primary">
              Add a vehicle
            </Link>
          </div>
        )}

        {step === 'date' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-text-primary">Pick a date</h2>
            <Input
              label="Date"
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Button className="w-full" disabled={!date} onClick={goNext}>
              Continue
            </Button>
          </div>
        )}

        {step === 'slot' && (
          <div className="space-y-2">
            <h2 className="font-semibold text-text-primary">Pick a time slot</h2>
            {slotsQuery.isLoading && <Spinner />}
            {slotsQuery.data?.slots.length === 0 && (
              <EmptyState title="No slots available" description="Try another date." />
            )}
            {slotsQuery.data?.slots.map((slot) => (
              <button
                key={slot.start}
                type="button"
                onClick={() => {
                  setSlotStart(slot.start)
                  goNext()
                }}
                className="block w-full rounded-xl border border-border bg-surface p-3 text-left hover:border-primary"
              >
                {new Date(slot.start).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' – '}
                {new Date(slot.end).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </button>
            ))}
          </div>
        )}

        {step === 'notes' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-text-primary">Add notes (optional)</h2>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text-secondary">Notes for the garage</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
                placeholder="Describe the issue or any preferences…"
              />
            </label>
            <Button className="w-full" onClick={goNext}>
              Continue
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-text-primary">Confirm booking</h2>
            <dl className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Garage</dt>
                <dd className="text-right font-medium">{garage.displayName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Branch</dt>
                <dd className="text-right">{selectedBranch?.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">Service</dt>
                <dd className="text-right">{service?.name}</dd>
              </div>
              {vehicleId && (
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">Vehicle</dt>
                  <dd className="text-right">
                    {vehicleLabel(vehiclesQuery.data?.find((v) => v.id === vehicleId) ?? { year: 0 })}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">When</dt>
                <dd className="text-right">{new Date(slotStart).toLocaleString()}</dd>
              </div>
            </dl>
            {error && <p className="text-sm text-error">{error}</p>}
            <Button className="w-full" loading={bookMutation.isPending} onClick={() => bookMutation.mutate()}>
              Confirm booking
            </Button>
          </div>
        )}

        {step !== 'branch' && step !== 'confirm' && (
          <Button variant="ghost" className="mt-6 w-full" onClick={goBack}>
            Back
          </Button>
        )}
      </div>
    </div>
  )
}
