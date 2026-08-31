import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { createDispute } from '../services/api/disputes'

const REASON_CODES = [
  { value: 'service_not_completed', label: 'Service not completed' },
  { value: 'service_quality', label: 'Service quality' },
  { value: 'unexpected_charge', label: 'Unexpected charge' },
  { value: 'pricing_dispute', label: 'Pricing dispute' },
  { value: 'incorrect_invoice', label: 'Incorrect invoice' },
  { value: 'payment_issue', label: 'Payment issue' },
  { value: 'appointment_issue', label: 'Appointment issue' },
  { value: 'quotation_issue', label: 'Quotation issue' },
  { value: 'review_issue', label: 'Review issue' },
  { value: 'damage_claim', label: 'Damage claim' },
  { value: 'communication_issue', label: 'Communication issue' },
  { value: 'other', label: 'Other' },
] as const

export function DisputeNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [businessId, setBusinessId] = useState(searchParams.get('businessId') ?? '')
  const [reasonCode, setReasonCode] = useState('other')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [appointmentId, setAppointmentId] = useState(searchParams.get('appointmentId') ?? '')
  const [invoiceId, setInvoiceId] = useState(searchParams.get('invoiceId') ?? '')
  const [quotationId, setQuotationId] = useState(searchParams.get('quotationId') ?? '')
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      createDispute({
        businessId,
        reasonCode,
        summary: summary.trim(),
        description: description.trim() || undefined,
        initialMessage: initialMessage.trim() || undefined,
        appointmentId: appointmentId || undefined,
        invoiceId: invoiceId || undefined,
        quotationId: quotationId || undefined,
      }),
    onSuccess: (d) => navigate(`/disputes/${d.id}`, { replace: true }),
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create dispute'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId.trim() || !summary.trim()) {
      setError('Business ID and summary are required.')
      return
    }
    setError('')
    createMutation.mutate()
  }

  return (
    <div>
      <PageHeader title="New dispute" backTo="/disputes" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Business ID"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            required
            placeholder="UUID from invoice or appointment"
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-secondary">Reason</span>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            >
              {REASON_CODES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            maxLength={500}
            placeholder="Brief summary of the issue"
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-secondary">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-secondary">Initial message (optional)</span>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            />
          </label>
          <Input
            label="Appointment ID (optional)"
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
          />
          <Input
            label="Invoice ID (optional)"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          />
          <Input
            label="Quotation ID (optional)"
            value={quotationId}
            onChange={(e) => setQuotationId(e.target.value)}
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" loading={createMutation.isPending}>
            Submit dispute
          </Button>
        </form>
      </div>
    </div>
  )
}
