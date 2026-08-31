import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { useLocale } from '../i18n/LocaleProvider'
import { listVehicleMakes, listVehicleModels } from '../services/api/catalog'
import { createVehicle, getVehicle, updateVehicle } from '../services/api/vehicles'

export function VehicleFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLocale()

  const [makeId, setMakeId] = useState('')
  const [modelId, setModelId] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [plateNumber, setPlateNumber] = useState('')
  const [vin, setVin] = useState('')
  const [color, setColor] = useState('')
  const [mileage, setMileage] = useState('')
  const [trim, setTrim] = useState('')
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

  const modelsQuery = useQuery({
    queryKey: ['vehicle-models', makeId],
    queryFn: () => listVehicleModels(makeId),
    enabled: !!makeId,
  })

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
  }, [vehicleQuery.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        makeId,
        modelId,
        year: Number(year),
        plateNumber: plateNumber.trim() || null,
        vin: vin.trim() || null,
        color: color.trim() || null,
        trim: trim.trim() || null,
        mileage: mileage ? Number(mileage) : null,
      }
      if (isEdit) return updateVehicle(id!, body)
      return createVehicle(body)
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
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-secondary">{t('common.make')}</span>
            <select
              value={makeId}
              onChange={(e) => {
                setMakeId(e.target.value)
                setModelId('')
              }}
              required
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            >
              <option value="">{t('vehicles.selectMake')}</option>
              {makesQuery.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-secondary">{t('common.model')}</span>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              required
              disabled={!makeId}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary disabled:opacity-50"
            >
              <option value="">{t('vehicles.selectModel')}</option>
              {modelsQuery.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

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
