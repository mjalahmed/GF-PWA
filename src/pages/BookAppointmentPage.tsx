import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { MakeLogo } from '../components/ui/MakeLogo'
import { Spinner } from '../components/ui/Spinner'
import { formatDateLocalized, formatTimeLocalized, vehicleLabelLocalized } from '../i18n/format'
import { localizedText } from '../i18n/localized'
import { useLocale } from '../i18n/LocaleProvider'
import { formatMoney, primaryBranch } from '../lib/utils'
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
  const { t, dateLocale, locale } = useLocale()
  const [step, setStep] = useState<Step>('branch')
  const [branchId, setBranchId] = useState('')
  const [service, setService] = useState<PublicService | null>(null)
  const [serviceQuery, setServiceQuery] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [garageVehicleConsent, setGarageVehicleConsent] = useState(false)
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
    enabled: step === 'vehicle' || step === 'slot' || step === 'confirm',
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

  const canBook = !service?.requiresVehicle || Boolean(vehicleId) || garageVehicleConsent

  const bookMutation = useMutation({
    mutationFn: () =>
      createAppointment({
        businessId: garage!.id,
        branchId,
        serviceId: service!.id,
        scheduledStart: slotStart,
        vehicleId: vehicleId || undefined,
        customerNotes: notes.trim() || undefined,
        customerConsentsGarageVehicle: !vehicleId && garageVehicleConsent ? true : undefined,
      }),
    onSuccess: (appt) => navigate(`/appointments/${appt.id}`, { replace: true }),
    onError: (err) => setError(err instanceof Error ? err.message : t('book.failed')),
  })

  if (garageQuery.isLoading) return <Spinner />
  if (garageQuery.error || !garage) {
    return (
      <div>
        <PageHeader title={t('book.titleShort')} backTo="/search" />
        <EmptyState
          title={t('garage.notFound')}
          actionLabel={t('common.back')}
          onAction={() => navigate('/search')}
        />
      </div>
    )
  }

  const stepIndex = STEPS.indexOf(step)
  const selectedBranch = garage.branches.find((b) => b.id === branchId) ?? primaryBranch(garage)

  const filteredServices = useMemo(() => {
    const items = servicesQuery.data?.items ?? []
    const q = serviceQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter((svc) => {
      const name = localizedText(locale, svc.name, svc.nameAr).toLowerCase()
      return name.includes(q)
    })
  }, [servicesQuery.data?.items, serviceQuery, locale])

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
      <PageHeader title={t('book.title')} backTo={`/garages/${slug}`} />
      <div className="mx-auto max-w-lg px-4 py-4">
        <p className="mb-4 text-sm text-text-muted">
          {t('common.stepOf', {
            current: stepIndex + 1,
            total: STEPS.length,
            name: garage.displayName,
          })}
        </p>

        {step === 'branch' && (
          <div className="space-y-2">
            <h2 className="font-semibold text-text-primary">{t('book.chooseBranch')}</h2>
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
            <h2 className="font-semibold text-text-primary">{t('book.chooseService')}</h2>
            <Input
              type="search"
              placeholder={t('common.search')}
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
            />
            {servicesQuery.isLoading && <Spinner />}
            {filteredServices.map((svc) => (
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
                <p className="font-medium">{localizedText(locale, svc.name, svc.nameAr)}</p>
                <p className="text-sm text-text-muted">
                  {svc.price != null ? formatMoney(svc.price) : t('common.priceOnRequest')}
                  {svc.estimatedDurationMinutes != null &&
                    ` · ${t('common.minutes', { minutes: svc.estimatedDurationMinutes })}`}
                </p>
              </button>
            ))}
            {!servicesQuery.isLoading && filteredServices.length === 0 && (
              <EmptyState
                title={
                  servicesQuery.data?.items.length ? t('common.noResults') : t('book.noServices')
                }
                description={
                  servicesQuery.data?.items.length
                    ? undefined
                    : t('book.noServicesDesc')
                }
              />
            )}
          </div>
        )}

        {step === 'vehicle' && (
          <div className="space-y-2">
            <h2 className="font-semibold text-text-primary">{t('book.chooseVehicle')}</h2>
            {vehiclesQuery.data?.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  // Reselecting/changing vehicle clears notes per product flow
                  setNotes('')
                  setVehicleId(v.id)
                  setGarageVehicleConsent(false)
                  goNext()
                }}
                className="block w-full rounded-xl border border-border bg-surface p-4 text-left hover:border-primary"
              >
                <div className="flex items-center gap-2">
                  <MakeLogo make={v.makeText} size={28} />
                  <div className="min-w-0">
                    <p className="font-medium">{vehicleLabelLocalized(v, t)}</p>
                    {v.plateNumber && <p className="text-sm text-text-muted">{v.plateNumber}</p>}
                  </div>
                </div>
              </button>
            ))}
            <Link to="/vehicles/new" className="block text-center text-sm text-primary">
              {t('book.addVehicle')}
            </Link>
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="flex items-start gap-3 text-sm text-text-primary">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={garageVehicleConsent && !vehicleId}
                  onChange={(e) => {
                    setGarageVehicleConsent(e.target.checked)
                    if (e.target.checked) setVehicleId('')
                  }}
                />
                <span>{t('book.garageVehicleConsent')}</span>
              </label>
              <Button
                className="mt-3 w-full"
                disabled={!garageVehicleConsent}
                onClick={() => {
                  setVehicleId('')
                  goNext()
                }}
              >
                {t('common.continue')}
              </Button>
            </div>
          </div>
        )}

        {step === 'date' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-text-primary">{t('book.pickDate')}</h2>
            <Input
              label={t('book.date')}
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Button className="w-full" disabled={!date} onClick={goNext}>
              {t('common.continue')}
            </Button>
          </div>
        )}

        {step === 'slot' && (
          <div className="space-y-2">
            <h2 className="font-semibold text-text-primary">{t('book.pickSlot')}</h2>
            {slotsQuery.isLoading && <Spinner />}
            {slotsQuery.data?.slots.length === 0 && (
              <EmptyState title={t('book.noSlots')} description={t('book.noSlotsDesc')} />
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
                {formatTimeLocalized(slot.start, dateLocale)}
                {' – '}
                {formatTimeLocalized(slot.end, dateLocale)}
              </button>
            ))}
          </div>
        )}

        {step === 'notes' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-text-primary">{t('book.addNotes')}</h2>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-text-secondary">{t('book.notesLabel')}</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
                placeholder={t('book.notesPlaceholder')}
              />
            </label>
            <Button className="w-full" onClick={goNext}>
              {t('common.continue')}
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-text-primary">{t('book.confirmTitle')}</h2>
            <dl className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">{t('common.garage')}</dt>
                <dd className="text-right font-medium">{garage.displayName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">{t('common.branch')}</dt>
                <dd className="text-right">{selectedBranch?.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">{t('common.service')}</dt>
                <dd className="text-right">
                  {service ? localizedText(locale, service.name, service.nameAr) : ''}
                </dd>
              </div>
              {vehicleId && (
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">{t('common.vehicle')}</dt>
                  <dd className="text-right">
                    {vehicleLabelLocalized(
                      vehiclesQuery.data?.find((v) => v.id === vehicleId) ?? { year: 0 },
                      t,
                    )}
                  </dd>
                </div>
              )}
              {!vehicleId && garageVehicleConsent && (
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">{t('common.vehicle')}</dt>
                  <dd className="text-right text-sm">{t('book.consentConfirmed')}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">{t('common.when')}</dt>
                <dd className="text-right">{formatDateLocalized(slotStart, dateLocale)}</dd>
              </div>
              {notes.trim() && (
                <div className="flex justify-between gap-4">
                  <dt className="text-text-muted">{t('book.notesLabel')}</dt>
                  <dd className="max-w-[60%] text-right whitespace-pre-wrap">{notes.trim()}</dd>
                </div>
              )}
            </dl>
            {error && <p className="text-sm text-error">{error}</p>}
            {!canBook && (
              <p className="text-sm text-error">{t('book.vehicleOrConsentRequired')}</p>
            )}
            <Button
              className="w-full"
              loading={bookMutation.isPending}
              disabled={!canBook}
              onClick={() => bookMutation.mutate()}
            >
              {t('book.confirm')}
            </Button>
          </div>
        )}

        {step !== 'branch' && step !== 'confirm' && (
          <Button variant="ghost" className="mt-6 w-full" onClick={goBack}>
            {t('common.back')}
          </Button>
        )}
      </div>
    </div>
  )
}
