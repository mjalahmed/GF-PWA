import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import {
  getBusinessSettings,
  updateBusinessSettings,
} from '../../services/api/business'
import type { BusinessSettings } from '../../types/onboarding'

const CAPABILITY_TOGGLES: Array<{
  key: keyof Pick<
    BusinessSettings,
    | 'appointmentsEnabled'
    | 'productsEnabled'
    | 'quotationsEnabled'
    | 'invoicesEnabled'
    | 'cashPaymentsEnabled'
    | 'onlinePaymentsEnabled'
    | 'reviewsEnabled'
    | 'publiclyVisible'
  >
  label: string
  hint: string
}> = [
  { key: 'appointmentsEnabled', label: 'Appointments', hint: 'Customers can book visits' },
  { key: 'productsEnabled', label: 'Products', hint: 'Show parts/products publicly' },
  { key: 'quotationsEnabled', label: 'Quotations', hint: 'Issue quotes to customers' },
  { key: 'invoicesEnabled', label: 'Invoices', hint: 'Issue invoices' },
  { key: 'cashPaymentsEnabled', label: 'Cash payments', hint: 'Record cash payments' },
  { key: 'onlinePaymentsEnabled', label: 'Online payments', hint: 'Accept online payments' },
  { key: 'reviewsEnabled', label: 'Reviews', hint: 'Allow customer reviews' },
  {
    key: 'publiclyVisible',
    label: 'Publicly visible',
    hint: 'Soft discovery flag (stored in settings metadata until backend column lands)',
  },
]

type Props = {
  businessId: string
  backTo: string
}

export function GarageCapabilitiesForm({ businessId, backTo }: Props) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [draft, setDraft] = useState<Partial<BusinessSettings>>({})

  const settingsQuery = useQuery({
    queryKey: ['business-settings', businessId],
    queryFn: () => getBusinessSettings(businessId),
    enabled: Boolean(businessId),
  })

  useEffect(() => {
    if (!settingsQuery.data) return
    setDraft(settingsQuery.data)
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateBusinessSettings(businessId, {
        appointmentsEnabled: Boolean(draft.appointmentsEnabled),
        productsEnabled: Boolean(draft.productsEnabled),
        quotationsEnabled: Boolean(draft.quotationsEnabled),
        invoicesEnabled: Boolean(draft.invoicesEnabled),
        cashPaymentsEnabled: Boolean(draft.cashPaymentsEnabled),
        onlinePaymentsEnabled: Boolean(draft.onlinePaymentsEnabled),
        reviewsEnabled: Boolean(draft.reviewsEnabled),
        publiclyVisible: Boolean(draft.publiclyVisible),
      }),
    onSuccess: () => {
      setSuccess('Capabilities saved.')
      setError('')
      void queryClient.invalidateQueries({ queryKey: ['business-settings', businessId] })
      void queryClient.invalidateQueries({ queryKey: ['garage-setup', businessId] })
    },
    onError: (err: Error) => setError(err.message),
  })

  if (settingsQuery.isLoading) return <Spinner />
  if (!settingsQuery.data) {
    return <p className="p-4 text-error">Could not load settings.</p>
  }

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <Link to={backTo} className="text-sm text-primary">
        ← Back
      </Link>
      <div>
        <h2 className="text-xl font-semibold">Garage capabilities</h2>
        <p className="text-sm text-text-muted">
          Toggle which features this garage can use after approval.
        </p>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}

      <ul className="space-y-3">
        {CAPABILITY_TOGGLES.map((item) => (
          <li key={item.key} className="rounded-xl border border-border bg-surface p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 size-4 rounded border-border"
                checked={Boolean(draft[item.key])}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [item.key]: e.target.checked }))
                }
              />
              <span>
                <span className="block font-medium text-text-primary">{item.label}</span>
                <span className="block text-xs text-text-muted">{item.hint}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
        Save capabilities
      </Button>
    </section>
  )
}

export function AdminGarageCapabilitiesPage() {
  const { businessId = '' } = useParams()
  return (
    <GarageCapabilitiesForm
      businessId={businessId}
      backTo={`/admin/businesses/${businessId}/setup`}
    />
  )
}
