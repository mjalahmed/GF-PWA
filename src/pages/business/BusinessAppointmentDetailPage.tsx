import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { BeforeAfterGallery } from '../../components/ui/BeforeAfterGallery'
import { Button } from '../../components/ui/Button'
import { ImageUpload } from '../../components/ui/ImageUpload'
import { MakeLogo } from '../../components/ui/MakeLogo'
import { SearchableSelect } from '../../components/ui/SearchableSelect'
import { Spinner } from '../../components/ui/Spinner'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { formatMoney } from '../../lib/utils'
import { hasMotomarksLogo } from '../../lib/motomarks'
import { uploadFile, uploadImage, vehicleImagePath as buildVehicleImagePath } from '../../lib/upload'
import { VEHICLE_TYPE_OPTIONS, vehicleTypeLabelKey } from '../../lib/vehicleTypes'
import { useLocale } from '../../i18n/LocaleProvider'
import {
  createCustomerVehicle,
  createQuotationFromAppointment,
  getBusinessAppointment,
  registerAppointmentMedia,
  setAppointmentStatus,
  transitionAppointment,
} from '../../services/api/business'
import { listVehicleMakes, listVehicleModels } from '../../services/api/catalog'
import { getAppointmentMedia, type RepairPhoto } from '../../services/api/experience'
import { Input } from '../../components/ui/Input'
import { GENERIC_APPOINTMENT_STATUSES } from '../../types/appointments'

const ACTIONS: Record<
  string,
  Array<'confirm' | 'reject' | 'cancel' | 'arrive' | 'start' | 'complete' | 'no-show'>
> = {
  requested: ['confirm', 'reject'],
  confirmed: ['arrive', 'start', 'cancel', 'no-show'],
  customer_arrived: ['start', 'cancel'],
  quote_accepted: ['arrive', 'start', 'cancel'],
  waiting: ['start', 'complete'],
  waiting_for_parts: ['start', 'complete'],
  waiting_for_customer: ['start', 'complete', 'cancel'],
  in_progress: ['complete'],
  ready_for_pickup: ['complete'],
}

const GENERIC_FROM: Record<string, string[]> = {
  confirmed: ['quote_pending', 'waiting'],
  customer_arrived: ['waiting', 'waiting_for_parts'],
  in_progress: ['waiting', 'waiting_for_parts', 'waiting_for_customer', 'ready_for_pickup', 'disputed'],
  waiting: ['waiting_for_parts', 'waiting_for_customer', 'in_progress', 'ready_for_pickup'],
  waiting_for_parts: ['waiting', 'in_progress', 'ready_for_pickup'],
  waiting_for_customer: ['waiting', 'in_progress', 'ready_for_pickup', 'disputed'],
  quote_pending: ['quote_accepted', 'waiting'],
  quote_accepted: ['waiting', 'in_progress'],
  ready_for_pickup: ['completed', 'disputed'],
}

function vehicleDisplay(
  appt: {
    vehicle?: {
      displayLabel?: string
      year?: number
      makeText?: string
      modelText?: string
      plateNumber?: string
    }
    vehicleId?: string
  },
  fallback: string,
): string {
  const v = appt.vehicle
  if (!v) return appt.vehicleId ? fallback : '—'
  if (v.displayLabel) return v.displayLabel
  const built = [v.makeText, v.modelText, v.year].filter(Boolean).join(' ')
  return built || v.plateNumber || '—'
}

export function BusinessAppointmentDetailPage() {
  const { appointmentId = '' } = useParams()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const { t, statusLabel } = useLocale()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [completedInvoiceId, setCompletedInvoiceId] = useState<string | null>(null)
  const [uploadPhase, setUploadPhase] = useState<'before' | 'after'>('before')
  const fileRef = useRef<HTMLInputElement>(null)
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [vehicleMakeId, setVehicleMakeId] = useState('')
  const [vehicleModelId, setVehicleModelId] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleYear, setVehicleYear] = useState(String(new Date().getFullYear()))
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleVin, setVehicleVin] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [vehicleMileage, setVehicleMileage] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleFuel, setVehicleFuel] = useState('')
  const [vehicleTransmission, setVehicleTransmission] = useState('')
  const [vehicleImagePath, setVehicleImagePath] = useState<string | null>(null)

  const businessIdHint = params.get('businessId') || ''

  const makesQuery = useQuery({
    queryKey: ['vehicle-makes'],
    queryFn: listVehicleMakes,
    enabled: showAddVehicle,
  })
  const supportedMakes = useMemo(
    () => (makesQuery.data ?? []).filter((m) => hasMotomarksLogo(m.slug || m.name)),
    [makesQuery.data],
  )
  const modelsQuery = useQuery({
    queryKey: ['vehicle-models', vehicleMakeId],
    queryFn: () => listVehicleModels(vehicleMakeId),
    enabled: showAddVehicle && !!vehicleMakeId,
  })

  const detailQuery = useQuery({
    queryKey: ['business-appointment', businessIdHint, appointmentId],
    queryFn: async () => {
      if (businessIdHint) {
        try {
          return await getBusinessAppointment(businessIdHint, appointmentId)
        } catch {
          // Fall through if enriched endpoint is unavailable
        }
      }
      const { getAppointment } = await import('../../services/api/appointments')
      return getAppointment(appointmentId)
    },
    enabled: Boolean(appointmentId),
  })

  const businessId = businessIdHint || detailQuery.data?.businessId || ''

  const mediaQuery = useQuery({
    queryKey: ['repair-photos', appointmentId],
    queryFn: () => getAppointmentMedia(appointmentId),
    enabled: Boolean(appointmentId),
    retry: false,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['business-appointment'] })
    void queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] })
    void queryClient.invalidateQueries({ queryKey: ['business-appointments'] })
    void queryClient.invalidateQueries({ queryKey: ['repair-photos', appointmentId] })
  }

  const actionMutation = useMutation({
    mutationFn: ({
      action,
    }: {
      action: 'confirm' | 'reject' | 'cancel' | 'arrive' | 'start' | 'complete' | 'no-show'
    }) =>
      transitionAppointment(
        appointmentId,
        action,
        action === 'reject' || action === 'cancel' ? { reason: 'Updated by garage' } : undefined,
      ),
    onSuccess: (result, vars) => {
      setError('')
      setMessage(t('biz.appointment.statusUpdated'))
      if (vars.action === 'complete') {
        const invoiceId = String(
          (result as Record<string, unknown>).invoiceId ??
            (result as Record<string, unknown>).invoice_id ??
            ((result as Record<string, unknown>).invoice as Record<string, unknown> | undefined)?.id ??
            '',
        )
        if (invoiceId) setCompletedInvoiceId(invoiceId)
      }
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => setAppointmentStatus(appointmentId, status),
    onSuccess: () => {
      setError('')
      setMessage(t('biz.appointment.statusUpdated'))
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const quoteMutation = useMutation({
    mutationFn: () => createQuotationFromAppointment(businessId, appointmentId),
    onSuccess: (result) => {
      const id = String(result.id ?? '')
      setMessage(
        id
          ? t('biz.appointment.quoteCreatedId', { id: id.slice(0, 8) })
          : t('biz.appointment.quoteCreated'),
      )
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!businessId) throw new Error(t('biz.appointment.missingBusiness'))
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${businessId}/${appointmentId}/${uploadPhase}/${Date.now()}-${safe}`
      await uploadFile('repair-photos', path, file)
      await registerAppointmentMedia(businessId, appointmentId, {
        phase: uploadPhase,
        storagePath: path,
      })
    },
    onSuccess: () => {
      setMessage(t('biz.appointment.photoUploaded'))
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const addVehicleMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error(t('biz.appointment.missingBusiness'))
      const customerId = String(detailQuery.data?.customerId ?? '')
      if (!customerId) throw new Error(t('biz.appointment.noCustomer'))
      if (!vehicleMake.trim() || !vehicleModel.trim()) {
        throw new Error(t('biz.appointment.makeModelRequired'))
      }
      const year = Number(vehicleYear)
      if (!Number.isFinite(year) || year < 1950) throw new Error(t('biz.appointment.validYear'))
      return createCustomerVehicle(businessId, {
        customerId,
        sourceAppointmentId: appointmentId,
        makeId: vehicleMakeId || null,
        modelId: vehicleModelId || null,
        makeText: vehicleMake.trim(),
        modelText: vehicleModel.trim(),
        year,
        registrationNumber: vehiclePlate.trim() || null,
        vin: vehicleVin.trim() || null,
        color: vehicleColor.trim() || null,
        mileage: vehicleMileage ? Number(vehicleMileage) : null,
        imagePath: vehicleImagePath,
        vehicleType: vehicleType || null,
        bodyType: vehicleType || null,
        fuelType: vehicleFuel.trim() || null,
        transmission: vehicleTransmission.trim() || null,
      })
    },
    onSuccess: () => {
      setMessage(t('biz.appointment.vehicleAdded'))
      setError('')
      setShowAddVehicle(false)
      setVehicleMakeId('')
      setVehicleModelId('')
      setVehicleMake('')
      setVehicleModel('')
      setVehiclePlate('')
      setVehicleVin('')
      setVehicleColor('')
      setVehicleMileage('')
      setVehicleType('')
      setVehicleFuel('')
      setVehicleTransmission('')
      setVehicleImagePath(null)
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  if (detailQuery.isLoading) return <Spinner />
  if (!detailQuery.data) {
    return (
      <section className="mx-auto max-w-lg space-y-3 px-4 py-4">
        <p className="text-error">{t('biz.appointment.notFound')}</p>
        <Link to="/business/appointments" className="text-primary">
          ← {t('biz.nav.appointments')}
        </Link>
      </section>
    )
  }

  const appt = detailQuery.data
  const actions = ACTIONS[appt.status] ?? []
  const genericStatuses = (GENERIC_FROM[appt.status] ?? []).filter((s) =>
    (GENERIC_APPOINTMENT_STATUSES as readonly string[]).includes(s),
  )
  const expectedMinutes = appt.services.reduce(
    (sum, s) => sum + (s.estimatedDurationMinutes || 0),
    0,
  )
  const backHref = businessId
    ? `/business/appointments?businessId=${encodeURIComponent(businessId)}`
    : '/business/appointments'

  const customerName = appt.customer?.fullName
  const customerContact = [appt.customer?.phone, appt.customer?.email].filter(Boolean).join(' · ')
  const invoiceLinkId = completedInvoiceId || appt.invoiceId || appt.invoice?.id

  const galleryPhotos: RepairPhoto[] =
    mediaQuery.data && mediaQuery.data.length > 0
      ? mediaQuery.data
      : (appt.media ?? []).map((m) => ({
          id: m.id,
          appointmentId,
          phase: (m.phase === 'before' || m.phase === 'after' || m.phase === 'during'
            ? m.phase
            : 'during') as RepairPhoto['phase'],
          storagePath: m.storagePath,
          caption: m.caption ?? null,
          sortOrder: m.sortOrder ?? 0,
          createdAt: m.createdAt ?? '',
        }))

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <Link to={backHref} className="text-sm text-primary">
          ← {t('biz.nav.appointments')}
        </Link>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">{t('biz.appointment.title')}</h2>
            <p className="text-sm text-text-muted">
              {appt.scheduledStart ? new Date(appt.scheduledStart).toLocaleString() : '—'}
            </p>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}
        {invoiceLinkId && (
          <Link
            to={`/business/invoices?businessId=${encodeURIComponent(businessId)}`}
            className="block rounded-xl border border-primary/30 bg-primary-light/30 px-4 py-3 text-sm font-medium text-primary"
          >
            {t('biz.appointment.viewInvoice')}
          </Link>
        )}

        <dl className="space-y-3 rounded-xl border border-border bg-surface p-4 text-sm">
          <div>
            <dt className="text-text-muted">{t('common.customer')}</dt>
            <dd className="font-medium">{customerName || appt.customerId || '—'}</dd>
            {customerContact && <dd className="text-text-muted">{customerContact}</dd>}
          </div>
          <div>
            <dt className="text-text-muted">{t('common.vehicle')}</dt>
            <dd className="flex items-center gap-2 font-medium">
              <MakeLogo make={appt.vehicle?.makeText} size={24} />
              <span>{vehicleDisplay(appt, t('biz.appointment.vehicleFallback'))}</span>
            </dd>
            {appt.vehicle?.plateNumber && (
              <dd className="text-text-muted">{appt.vehicle.plateNumber}</dd>
            )}
            {businessId && appt.customerId && (
              <dd className="mt-2">
                {!showAddVehicle ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-primary"
                    onClick={() => setShowAddVehicle(true)}
                  >
                    {t('biz.appointment.addVehicle')}
                  </button>
                ) : (
                  <div className="mt-2 space-y-2 rounded-lg bg-surface-secondary p-3">
                    <p className="text-xs text-text-muted">{t('biz.appointment.addVehicleHint')}</p>
                    <SearchableSelect
                      label={t('common.make')}
                      value={vehicleMakeId}
                      placeholder={t('vehicles.selectMake')}
                      onChange={(id) => {
                        setVehicleMakeId(id)
                        setVehicleModelId('')
                        setVehicleModel('')
                        const make = supportedMakes.find((m) => m.id === id)
                        setVehicleMake(make?.name ?? '')
                      }}
                      options={supportedMakes.map((m) => ({
                        value: m.id,
                        label: m.name,
                        searchText: `${m.name} ${m.slug}`,
                        leading: <MakeLogo make={m.name} slug={m.slug} size={22} />,
                      }))}
                    />
                    <SearchableSelect
                      label={t('common.model')}
                      value={vehicleModelId}
                      disabled={!vehicleMakeId}
                      placeholder={t('vehicles.selectModel')}
                      onChange={(id) => {
                        setVehicleModelId(id)
                        const model = modelsQuery.data?.find((m) => m.id === id)
                        setVehicleModel(model?.name ?? '')
                      }}
                      options={(modelsQuery.data ?? []).map((m) => ({
                        value: m.id,
                        label: m.name,
                      }))}
                    />
                    <label className="block space-y-1.5">
                      <span className="text-sm font-medium text-text-secondary">
                        {t('vehicles.vehicleType')}
                      </span>
                      <select
                        value={vehicleType}
                        onChange={(e) => setVehicleType(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                      >
                        <option value="">{t('vehicles.selectType')}</option>
                        {VEHICLE_TYPE_OPTIONS.map((code) => (
                          <option key={code} value={code}>
                            {t(vehicleTypeLabelKey(code))}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Input
                      label={t('common.year')}
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                    />
                    <Input
                      label={t('vehicles.plateNumber')}
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                    />
                    <Input
                      label={t('common.vin')}
                      value={vehicleVin}
                      onChange={(e) => setVehicleVin(e.target.value)}
                    />
                    <Input
                      label={t('common.color')}
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                    />
                    <Input
                      label={t('vehicles.mileageKm')}
                      value={vehicleMileage}
                      onChange={(e) => setVehicleMileage(e.target.value)}
                    />
                    <Input
                      label={t('vehicles.fuelType')}
                      value={vehicleFuel}
                      onChange={(e) => setVehicleFuel(e.target.value)}
                    />
                    <Input
                      label={t('vehicles.transmission')}
                      value={vehicleTransmission}
                      onChange={(e) => setVehicleTransmission(e.target.value)}
                    />
                    <ImageUpload
                      bucket="vehicle-images"
                      label={t('vehicles.photo')}
                      value={vehicleImagePath}
                      onChange={setVehicleImagePath}
                      buildPath={(file) =>
                        buildVehicleImagePath(appt.customerId ?? 'customer', 'garage-add', file.name)
                      }
                      onUpload={async (file, path) => {
                        await uploadImage('vehicle-images', path, file)
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        loading={addVehicleMutation.isPending}
                        onClick={() => addVehicleMutation.mutate()}
                      >
                        {t('common.save')}
                      </Button>
                      <Button variant="ghost" onClick={() => setShowAddVehicle(false)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </dd>
            )}
          </div>
          {appt.startedAt && (
            <div>
              <dt className="text-text-muted">{t('biz.appointment.started')}</dt>
              <dd>{new Date(appt.startedAt).toLocaleString()}</dd>
            </div>
          )}
          {expectedMinutes > 0 && (
            <div>
              <dt className="text-text-muted">{t('biz.appointment.expectedDuration')}</dt>
              <dd>{t('common.minutes', { minutes: expectedMinutes })}</dd>
            </div>
          )}
          {appt.customerNotes && (
            <div>
              <dt className="text-text-muted">{t('biz.appointment.customerNotes')}</dt>
              <dd>{appt.customerNotes}</dd>
            </div>
          )}
          {appt.businessNotes && (
            <div>
              <dt className="text-text-muted">{t('biz.appointment.businessNotes')}</dt>
              <dd>{appt.businessNotes}</dd>
            </div>
          )}
        </dl>

        {appt.services.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">{t('common.services')}</h3>
            <ul className="space-y-2">
              {appt.services.map((svc) => (
                <li key={svc.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <p className="font-medium">{svc.serviceName}</p>
                  <p className="text-text-muted">
                    {t('common.minutes', { minutes: svc.estimatedDurationMinutes })}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(appt.quotation || appt.invoice || appt.quotationId || appt.invoiceId) && (
          <div className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
            <h3 className="font-semibold">{t('biz.appointment.commerce')}</h3>
            {(appt.quotation || appt.quotationId) && (
              <p>
                {t('biz.appointment.quotation')}:{' '}
                <Link
                  to={`/business/quotations?businessId=${encodeURIComponent(businessId)}`}
                  className="text-primary"
                >
                  {appt.quotation?.number ?? appt.quotationId?.slice(0, 8)}
                </Link>
                {appt.quotation?.status && ` · ${statusLabel(appt.quotation.status)}`}
                {appt.quotation?.grandTotal != null &&
                  ` · ${formatMoney(appt.quotation.grandTotal, appt.quotation.currency ?? 'BHD')}`}
              </p>
            )}
            {(appt.invoice || appt.invoiceId) && (
              <p>
                {t('biz.appointment.invoice')}:{' '}
                <Link
                  to={`/business/invoices?businessId=${encodeURIComponent(businessId)}`}
                  className="text-primary"
                >
                  {appt.invoice?.number ?? appt.invoiceId?.slice(0, 8)}
                </Link>
                {appt.invoice?.status && ` · ${statusLabel(appt.invoice.status)}`}
                {appt.invoice?.grandTotal != null &&
                  ` · ${formatMoney(appt.invoice.grandTotal, appt.invoice.currency ?? 'BHD')}`}
              </p>
            )}
          </div>
        )}

        {appt.statusHistory && appt.statusHistory.length > 0 && (
          <section>
            <h3 className="mb-2 font-semibold">{t('biz.appointment.statusHistory')}</h3>
            <ol className="space-y-2 border-s-2 border-border ps-3">
              {appt.statusHistory.map((h, idx) => (
                <li key={`${h.status}-${h.changedAt}-${idx}`} className="text-sm">
                  <p className="font-medium">{statusLabel(h.status)}</p>
                  <p className="text-xs text-text-muted">
                    {h.changedAt ? new Date(h.changedAt).toLocaleString() : ''}
                    {h.note ? ` · ${h.note}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const isThis =
                actionMutation.isPending && actionMutation.variables?.action === action
              return (
                <Button
                  key={action}
                  variant={action === 'reject' || action === 'cancel' ? 'danger' : 'secondary'}
                  loading={isThis}
                  disabled={actionMutation.isPending && !isThis}
                  onClick={() => actionMutation.mutate({ action })}
                >
                  {t(`biz.appointment.action.${action}`)}
                </Button>
              )
            })}
          </div>
        )}

        {genericStatuses.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-muted">{t('biz.appointment.setStatus')}</h3>
            <div className="flex flex-wrap gap-2">
              {genericStatuses.map((status) => {
                const isThis =
                  statusMutation.isPending && statusMutation.variables === status
                return (
                  <Button
                    key={status}
                    variant="secondary"
                    loading={isThis}
                    disabled={statusMutation.isPending && !isThis}
                    onClick={() => statusMutation.mutate(status)}
                  >
                    {statusLabel(status)}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {businessId && !appt.quotationId && !appt.quotation && (
          <Button
            variant="secondary"
            loading={quoteMutation.isPending}
            onClick={() => quoteMutation.mutate()}
          >
            {t('biz.appointment.createQuotation')}
          </Button>
        )}

        <section className="space-y-3">
          <h3 className="font-semibold">{t('repair.photos')}</h3>
          {galleryPhotos.length > 0 && <BeforeAfterGallery photos={galleryPhotos} />}
          {businessId && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
                value={uploadPhase}
                onChange={(e) => setUploadPhase(e.target.value as 'before' | 'after')}
              >
                <option value="before">{t('repair.before')}</option>
                <option value="after">{t('repair.after')}</option>
              </select>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadMutation.mutate(file)
                  e.target.value = ''
                }}
              />
              <Button
                variant="secondary"
                loading={uploadMutation.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {t('biz.appointment.uploadPhoto', { phase: t(`repair.${uploadPhase}`) })}
              </Button>
            </div>
          )}
        </section>
      </section>
    </RequireGarageSetup>
  )
}
