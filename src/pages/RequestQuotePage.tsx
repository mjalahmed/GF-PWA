import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { MakeLogo } from '../components/ui/MakeLogo'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { Spinner } from '../components/ui/Spinner'
import { vehicleLabelLocalized } from '../i18n/format'
import { useLocale } from '../i18n/LocaleProvider'
import { getBusinessBySlug } from '../services/api/garages'
import { createQuoteRequest } from '../services/api/experience'
import { listVehicles } from '../services/api/vehicles'

export function RequestQuotePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { t } = useLocale()
  const [description, setDescription] = useState('')
  const [vehicleId, setVehicleId] = useState('')

  const garageQuery = useQuery({
    queryKey: ['garage', slug],
    queryFn: () => getBusinessBySlug(slug!),
    enabled: !!slug,
  })

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles(),
  })

  const vehicleOptions = useMemo(
    () => [
      { value: '', label: t('quotes.noVehicle') },
      ...(vehiclesQuery.data ?? []).map((v) => ({
        value: v.id,
        label: vehicleLabelLocalized(v, t),
        searchText: [v.makeText, v.modelText, v.plateNumber, String(v.year)].filter(Boolean).join(' '),
        leading: <MakeLogo make={v.makeText} size={24} />,
      })),
    ],
    [vehiclesQuery.data, t],
  )

  const mutation = useMutation({
    mutationFn: () =>
      createQuoteRequest({
        businessId: garageQuery.data!.id,
        vehicleId: vehicleId || undefined,
        description: description.trim(),
      }),
    onSuccess: () => navigate('/quotations', { replace: true }),
  })

  if (garageQuery.isLoading) return <Spinner />

  const garage = garageQuery.data
  if (!garage) {
    return (
      <div>
        <PageHeader title={t('quotes.requestTitle')} backTo="/search" />
        <p className="p-4 text-sm text-error">{t('garage.notFound')}</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('quotes.requestTitle')} backTo={`/garages/${slug}`} />
      <form
        className="mx-auto max-w-lg space-y-4 px-4 py-6"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
      >
        <p className="text-sm text-text-muted">
          {t('quotes.requestHint', { name: garage.displayName })}
        </p>
        <SearchableSelect
          label={t('common.vehicle')}
          value={vehicleId}
          onChange={setVehicleId}
          options={vehicleOptions}
        />
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-text-secondary">{t('quotes.describeWork')}</span>
          <textarea
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
            rows={5}
            required
            minLength={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <Button type="submit" className="w-full" loading={mutation.isPending}>
          {t('quotes.submitRequest')}
        </Button>
      </form>
    </div>
  )
}
