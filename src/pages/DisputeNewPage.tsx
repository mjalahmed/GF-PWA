import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useLocale } from '../i18n/LocaleProvider'
import { disputeReasonKey } from '../i18n/messages'
import { createDispute } from '../services/api/disputes'

const REASON_CODES = [
  'service_not_completed',
  'service_quality',
  'unexpected_charge',
  'pricing_dispute',
  'incorrect_invoice',
  'payment_issue',
  'appointment_issue',
  'quotation_issue',
  'review_issue',
  'damage_claim',
  'communication_issue',
  'other',
] as const

export function DisputeNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useLocale()
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
    onError: (err) => setError(err instanceof Error ? err.message : t('disputes.createError')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId.trim() || !summary.trim()) {
      setError(t('disputes.required'))
      return
    }
    setError('')
    createMutation.mutate()
  }

  return (
    <div>
      <PageHeader title={t('disputes.new')} backTo="/disputes" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('disputes.businessId')}
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            required
            placeholder={t('disputes.businessIdPlaceholder')}
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-secondary">{t('disputes.reason')}</span>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            >
              {REASON_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(disputeReasonKey(code))}
                </option>
              ))}
            </select>
          </label>
          <Input
            label={t('disputes.summary')}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            maxLength={500}
            placeholder={t('disputes.summaryPlaceholder')}
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-secondary">{t('disputes.description')}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-text-secondary">{t('disputes.initialMessage')}</span>
            <textarea
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text-primary"
            />
          </label>
          <Input
            label={t('disputes.appointmentId')}
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
          />
          <Input
            label={t('disputes.invoiceId')}
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
          />
          <Input
            label={t('disputes.quotationId')}
            value={quotationId}
            onChange={(e) => setQuotationId(e.target.value)}
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" className="w-full" loading={createMutation.isPending}>
            {t('disputes.submit')}
          </Button>
        </form>
      </div>
    </div>
  )
}
