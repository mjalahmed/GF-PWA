import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useLocale } from '../i18n/LocaleProvider'
import { createEmergencyRequest } from '../services/api/experience'

export function EmergencyPage() {
  const { t } = useLocale()
  const navigate = useNavigate()
  const [requestType, setRequestType] = useState<
    'tow_nearest' | 'tow_garage' | 'roadside_assistance'
  >('tow_nearest')
  const [notes, setNotes] = useState('')
  const [addressText, setAddressText] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createEmergencyRequest({
        requestType,
        notes: notes.trim() || undefined,
        addressText: addressText.trim() || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
      }),
    onSuccess: () => navigate('/profile', { replace: true }),
  })

  const useLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }

  return (
    <div>
      <PageHeader title={t('emergency.title')} backTo="/" />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <p className="text-sm text-text-muted">{t('emergency.subtitle')}</p>

        <div className="grid gap-2">
          {(
            [
              ['tow_nearest', t('emergency.towNearest')],
              ['tow_garage', t('emergency.towGarage')],
              ['roadside_assistance', t('emergency.roadside')],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setRequestType(value)}
              className={`rounded-xl border p-4 text-start text-sm font-medium ${requestType === value ? 'border-primary bg-primary-light text-primary' : 'border-border bg-surface'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <Button type="button" variant="secondary" className="w-full" onClick={useLocation}>
          {coords ? t('emergency.locationCaptured') : t('emergency.useLocation')}
        </Button>

        <Input
          label={t('emergency.address')}
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder={t('emergency.addressPlaceholder')}
        />
        <Input
          label={t('emergency.notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('emergency.notesPlaceholder')}
        />

        <Button className="w-full" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          {t('emergency.submit')}
        </Button>
      </div>
    </div>
  )
}
