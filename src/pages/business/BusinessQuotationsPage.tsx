import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RequireGarageSetup } from '../../components/business/RequireGarageSetup'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import {
  cancelBusinessQuotation,
  createInvoiceFromQuotation,
  createQuotationFromAppointment,
  issueBusinessQuotation,
  listBusinessAppointments,
  listBusinessQuotations,
  listMyBusinessMemberships,
  updateBusinessSettings,
} from '../../services/api/business'

export function BusinessQuotationsPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [appointmentId, setAppointmentId] = useState('')
  const [itemDesc, setItemDesc] = useState('Service work')
  const [itemPrice, setItemPrice] = useState('50')

  const membershipsQuery = useQuery({
    queryKey: ['business-memberships'],
    queryFn: listMyBusinessMemberships,
  })
  const businessId = params.get('businessId') || membershipsQuery.data?.[0]?.businessId || ''

  const quotesQuery = useQuery({
    queryKey: ['business-quotations', businessId],
    queryFn: () => listBusinessQuotations(businessId),
    enabled: Boolean(businessId),
  })
  const appointmentsQuery = useQuery({
    queryKey: ['business-appointments', businessId, 'for-quotes'],
    queryFn: () => listBusinessAppointments(businessId),
    enabled: Boolean(businessId),
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['business-quotations', businessId] })
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!appointmentId) throw new Error('Select an appointment.')
      await updateBusinessSettings(businessId, { quotationsEnabled: true })
      return createQuotationFromAppointment(businessId, appointmentId, {
        items: [
          {
            itemType: 'custom',
            description: itemDesc.trim() || 'Service',
            quantity: 1,
            unitPrice: Number(itemPrice) || 0,
          },
        ],
      })
    },
    onSuccess: () => {
      setError('')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const issueMutation = useMutation({
    mutationFn: (quotationId: string) => issueBusinessQuotation(businessId, quotationId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })
  const cancelMutation = useMutation({
    mutationFn: (quotationId: string) => cancelBusinessQuotation(businessId, quotationId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })
  const invoiceMutation = useMutation({
    mutationFn: (quotationId: string) => createInvoiceFromQuotation(businessId, quotationId),
    onSuccess: () => navigate(`/business/invoices?businessId=${businessId}`),
    onError: (err: Error) => setError(err.message),
  })

  if (membershipsQuery.isLoading) return <Spinner />
  if (!businessId) {
    return (
      <p className="p-4 text-sm">
        No garage selected. <Link to="/business">Dashboard</Link>
      </p>
    )
  }

  return (
    <RequireGarageSetup businessId={businessId}>
      <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
        <h2 className="text-xl font-semibold">Quotations</h2>
        {error && <p className="text-sm text-error">{error}</p>}

        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <h3 className="font-medium">Create from appointment</h3>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Appointment</span>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
            >
              <option value="">Select…</option>
              {(appointmentsQuery.data ?? []).map((a) => (
                <option key={String(a.id)} value={String(a.id)}>
                  {String(a.status)} ·{' '}
                  {a.scheduledStart
                    ? new Date(String(a.scheduledStart)).toLocaleString()
                    : String(a.id).slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <Input label="Line item" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} />
          <Input label="Unit price (BHD)" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
          <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>
            Create draft quote
          </Button>
        </div>

        {quotesQuery.isLoading && <Spinner />}
        <ul className="space-y-3">
          {(quotesQuery.data ?? []).map((q) => {
            const id = String(q.id ?? '')
            const status = String(q.status ?? '')
            return (
              <li key={id} className="rounded-xl border border-border bg-surface p-4 text-sm">
                <div className="flex justify-between gap-2">
                  <strong className="capitalize">{status.replaceAll('_', ' ')}</strong>
                  <span className="text-text-muted">{id.slice(0, 8)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {status === 'draft' && (
                    <Button
                      variant="secondary"
                      loading={issueMutation.isPending}
                      onClick={() => issueMutation.mutate(id)}
                    >
                      Issue
                    </Button>
                  )}
                  {(status === 'draft' || status === 'issued') && (
                    <Button
                      variant="danger"
                      loading={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(id)}
                    >
                      Cancel
                    </Button>
                  )}
                  {(status === 'issued' || status === 'accepted') && (
                    <Button
                      variant="secondary"
                      loading={invoiceMutation.isPending}
                      onClick={() => invoiceMutation.mutate(id)}
                    >
                      Create invoice
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
          {!quotesQuery.isLoading && (quotesQuery.data ?? []).length === 0 && (
            <li className="text-sm text-text-muted">No quotations yet.</li>
          )}
        </ul>
      </section>
    </RequireGarageSetup>
  )
}
