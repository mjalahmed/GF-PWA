import { useMemo } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ImageUpload } from '../components/ui/ImageUpload'
import { Input } from '../components/ui/Input'
import { MakeLogo } from '../components/ui/MakeLogo'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { Spinner } from '../components/ui/Spinner'
import { VinReminderBanner } from '../components/ui/VinReminderBanner'
import { useAuth } from '../hooks/useAuth'
import { useLocale } from '../i18n/LocaleProvider'
import { hasMotomarksLogo } from '../lib/motomarks'
import { uploadImage, vehicleImagePath } from '../lib/upload'
import { VEHICLE_TYPE_OPTIONS, vehicleTypeLabelKey } from '../lib/vehicleTypes'
import { listVehicleMakes, listVehicleModels } from '../services/api/catalog'
import { createVehicle, getVehicle, updateVehicle } from '../services/api/vehicles'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export function VehicleFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLocale()
  const { session } = useAuth()

  const [makeId, setMakeId] = useState('')
  const [modelId, setModelId] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [plateNumber, setPlateNumber] = useState('')
  const [vin, setVin] = useState('')
  const [color, setColor] = useState('')
  const [mileage, setMileage] = useState('')
  const [trim, setTrim] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [error, setError] = useState('')

  const vehicleQuery = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => getVehicle(id!),
    enabled: isEdit,
  })

  const makesQuery = useQuery({
    queryKey: ['vehicle-makes'],
    queryFn: () => listVehicleMakes(),
  })

  const supportedMakes = useMemo(() => {
    const all = makesQuery.data ?? []
    const filtered = all.filter((m) => hasMotomarksLogo(m.slug || m.name))
    if (makeId && !filtered.some((m) => m.id === makeId)) {
      const current = all.find((m) => m.id === makeId)
      if (current) return [current, ...filtered]
    }
    return filtered
  }, [makesQuery.data, makeId])

  const modelsQuery = useQuery({
    queryKey: ['vehicle-models', makeId],
    queryFn: () => listVehicleModels(makeId),
    enabled: !!makeId,
  })

  const selectedMake = supportedMakes.find((m) => m.id === makeId)

  useEffect(() => {
    const v = vehicleQuery.data
    if (!v) return
    setMakeId(v.makeId)
    setModelId(v.modelId)
    setYear(String(v.year))
    setPlateNumber(v.plateNumber ?? '')
    setVin(v.vin ?? '')
    setColor(v.color ?? '')
    setMileage(v.mileage != null ? String(v.mileage) : '')
    setTrim(v.trim ?? '')
    setVehicleType(v.vehicleType ?? v.bodyType ?? '')
    setImagePath(v.imagePath ?? null)
  }, [vehicleQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        makeId,
        modelId,
        year: Number(year),
        plateNumber: plateNumber.trim() || undefined,
        vin: vin.trim() || undefined,
        color: color.trim() || undefined,
        trim: trim.trim() || undefined,
        mileage: mileage ? Number(mileage) : undefined,
        imagePath: imagePath ?? undefined,
        vehicleType: vehicleType || undefined,
        bodyType: vehicleType || undefined,
      }
      if (isEdit) return updateVehicle(id!, payload)
      return createVehicle(payload)
    },
    onSuccess: (v) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      navigate(`/vehicles/${v.id}`, { replace: true })
    },
    onError: (err) => setError(err instanceof Error ? err.message : t('vehicles.saveError')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!makeId || !modelId || !year) {
      setError(t('vehicles.required'))
      return
    }
    setError('')
    saveMutation.mutate()
  }

  if (isEdit && vehicleQuery.isLoading) return <Spinner />
  if (isEdit && vehicleQuery.error) {
    return (
      <div>
        <PageHeader title={t('vehicles.edit')} backTo="/vehicles" />
        <EmptyState
          title={t('vehicles.notFound')}
          actionLabel={t('common.back')}
          onAction={() => navigate('/vehicles')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('vehicles.edit') : t('vehicles.add')}
        backTo={isEdit ? `/vehicles/${id}` : '/vehicles'}
      />
      <div className="mx-auto max-w-lg px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <SearchableSelect
            label={t('common.make')}
            value={makeId}
            required
            placeholder={t('vehicles.selectMake')}
            onChange={(v) => {
              setMakeId(v)
              setModelId('')
            }}
            options={supportedMakes.map((m) => ({
              value: m.id,
              label: m.name,
              searchText: `${m.name} ${m.slug}`,
              leading: <MakeLogo make={m.name} slug={m.slug} size={24} />,
            }))}
          />

          <SearchableSelect
            label={t('common.model')}
            value={modelId}
            required
            disabled={!makeId}
            placeholder={t('vehicles.selectModel')}
            onChange={setModelId}
            options={(modelsQuery.data ?? []).map((m) => ({
              value: m.id,
              label: m.name,
              searchText: m.name,
            }))}
          />

          {selectedMake && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <MakeLogo make={selectedMake.name} slug={selectedMake.slug} size={28} />
              <span>{selectedMake.name}</span>
            </div>
          )}

          <SearchableSelect
            label={t('vehicles.vehicleType')}
            value={vehicleType}
            placeholder={t('vehicles.selectType')}
            onChange={setVehicleType}
            options={VEHICLE_TYPE_OPTIONS.map((code) => ({
              value: code,
              label: t(vehicleTypeLabelKey(code)),
            }))}
          />

          <Input
            label={t('common.year')}
            type="number"
            min={1980}
            max={new Date().getFullYear() + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
          <Input
            label={t('vehicles.plateNumber')}
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
          />
          <Input label={t('common.vin')} value={vin} onChange={(e) => setVin(e.target.value)} />
          {!vin.trim() && <VinReminderBanner vehicleId={id} />}
          <ImageUpload
            bucket="vehicle-images"
            value={imagePath}
            onChange={setImagePath}
            buildPath={(file) =>
              vehicleImagePath(session?.user.id ?? 'unknown', id ?? 'new', file.name)
            }
            onUpload={async (file, path) => {
              await uploadImage('vehicle-images', path, file)
            }}
          />
          <Input label={t('common.color')} value={color} onChange={(e) => setColor(e.target.value)} />
          <Input label={t('common.trim')} value={trim} onChange={(e) => setTrim(e.target.value)} />
          <Input
            label={t('vehicles.mileageKm')}
            type="number"
            min={0}
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
          />

          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" loading={saveMutation.isPending}>
            {isEdit ? t('vehicles.saveChanges') : t('vehicles.add')}
          </Button>
        </form>
      </div>
    </div>
  )
}
