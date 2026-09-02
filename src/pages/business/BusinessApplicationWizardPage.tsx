import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { PROVIDER_ACCEPTANCE } from '../../legal'
import { uploadFile } from '../../lib/upload'
import { useLocale } from '../../i18n/LocaleProvider'
import { recordLegalAcceptance } from '../../services/api/legal'
import {
  createApplicationDocument,
  createBusinessApplication,
  deleteApplicationDocument,
  getBusinessApplication,
  listBusinessCategories,
  listDocumentRequirements,
  submitBusinessApplication,
  updateApplicationBranch,
  updateBusinessApplication,
  withdrawBusinessApplication,
} from '../../services/api/business'

const STEPS = [
  { id: 'business_information', label: 'Business' },
  { id: 'contact_information', label: 'Contact' },
  { id: 'branch_information', label: 'Branch' },
  { id: 'documents', label: 'Documents' },
  { id: 'review_and_submit', label: 'Submit' },
] as const

type StepId = (typeof STEPS)[number]['id']

function mimeForFile(file: File): 'application/pdf' | 'image/jpeg' | 'image/png' | null {
  if (file.type === 'application/pdf') return 'application/pdf'
  if (file.type === 'image/jpeg') return 'image/jpeg'
  if (file.type === 'image/png') return 'image/png'
  return null
}

export function BusinessApplicationWizardPage() {
  const { applicationId = '' } = useParams()
  const isNew = applicationId === 'new'
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useLocale()
  const [step, setStep] = useState<StepId>('business_information')
  const [error, setError] = useState('')
  const [providerAccepted, setProviderAccepted] = useState(false)

  const [categoryId, setCategoryId] = useState('')
  const [legalName, setLegalName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [crNumber, setCrNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [addressLine, setAddressLine] = useState('')
  const [area, setArea] = useState('')
  const [city, setCity] = useState('Manama')

  const categoriesQuery = useQuery({
    queryKey: ['business-categories'],
    queryFn: listBusinessCategories,
  })

  const detailQuery = useQuery({
    queryKey: ['business-application', applicationId],
    queryFn: () => getBusinessApplication(applicationId),
    enabled: !isNew && Boolean(applicationId),
  })

  const app = detailQuery.data?.application
  const editable = !app || app.status === 'draft' || app.status === 'changes_requested'

  useEffect(() => {
    if (!detailQuery.data) return
    const a = detailQuery.data.application
    const b = detailQuery.data.branch
    setCategoryId(a.businessCategoryId)
    setLegalName(a.legalName)
    setDisplayName(a.displayName)
    setDescription(a.description ?? '')
    setCrNumber(a.commercialRegistrationNumber ?? '')
    setPhone(a.phone)
    setEmail(a.email)
    setWebsite(a.website ?? '')
    setAddressLine(b?.addressLine ?? '')
    setArea(b?.area ?? '')
    setCity(b?.city ?? 'Manama')
    if (a.currentStep && STEPS.some((s) => s.id === a.currentStep)) {
      setStep(a.currentStep as StepId)
    }
  }, [detailQuery.data])

  useEffect(() => {
    if (!isNew || categoryId || !categoriesQuery.data?.length) return
    const garage = categoriesQuery.data.find((c) => c.code === 'garage') ?? categoriesQuery.data[0]
    setCategoryId(garage.id)
  }, [isNew, categoryId, categoriesQuery.data])

  const requirementsQuery = useQuery({
    queryKey: ['doc-requirements', categoryId],
    queryFn: () => listDocumentRequirements(categoryId),
    enabled: Boolean(categoryId),
  })

  const saveBusinessMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        return createBusinessApplication({
          businessCategoryId: categoryId,
          legalName: legalName.trim(),
          displayName: displayName.trim(),
          description: description.trim() || null,
          commercialRegistrationNumber: crNumber.trim() || null,
          phone: phone.trim(),
          email: email.trim(),
          website: website.trim() || null,
        })
      }
      return updateBusinessApplication(applicationId, {
        businessCategoryId: categoryId,
        legalName: legalName.trim(),
        displayName: displayName.trim(),
        description: description.trim() || null,
        commercialRegistrationNumber: crNumber.trim() || null,
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim() || null,
        currentStep: 'contact_information',
      })
    },
    onSuccess: (saved) => {
      setError('')
      if (isNew) {
        void queryClient.invalidateQueries({ queryKey: ['my-business-applications'] })
        navigate(`/business/applications/${saved.id}`, { replace: true })
        return
      }
      setStep('contact_information')
      void detailQuery.refetch()
    },
    onError: (err: Error) => setError(err.message),
  })

  const saveContactMutation = useMutation({
    mutationFn: () =>
      updateBusinessApplication(applicationId, {
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim() || null,
        currentStep: 'branch_information',
      }),
    onSuccess: () => {
      setStep('branch_information')
      void detailQuery.refetch()
      setError('')
    },
    onError: (err: Error) => setError(err.message),
  })

  const saveBranchMutation = useMutation({
    mutationFn: async () => {
      if (!addressLine.trim()) throw new Error('Branch address is required.')
      await updateApplicationBranch(applicationId, {
        name: displayName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        addressLine: addressLine.trim(),
        area: area.trim() || null,
        city: city.trim() || null,
        countryCode: 'BH',
        timezone: 'Asia/Bahrain',
      })
      return updateBusinessApplication(applicationId, { currentStep: 'documents' })
    },
    onSuccess: () => {
      setStep('documents')
      void detailQuery.refetch()
      setError('')
    },
    onError: (err: Error) => setError(err.message),
  })

  const uploadMutation = useMutation({
    mutationFn: async ({
      requirementId,
      file,
      expiresAt,
    }: {
      requirementId: string
      file: File
      expiresAt?: string
    }) => {
      const mime = mimeForFile(file)
      if (!mime) throw new Error('Only PDF, JPEG, or PNG files are allowed.')
      const created = await createApplicationDocument(applicationId, {
        documentRequirementId: requirementId,
        originalFileName: file.name,
        mimeType: mime,
        fileSizeBytes: file.size,
        expiresAt: expiresAt || null,
      })
      await uploadFile(created.bucket, created.storagePath, file)
      return created.document
    },
    onSuccess: () => {
      void detailQuery.refetch()
      setError('')
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteDocMutation = useMutation({
    mutationFn: (documentId: string) => deleteApplicationDocument(applicationId, documentId),
    onSuccess: () => void detailQuery.refetch(),
    onError: (err: Error) => setError(err.message),
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!providerAccepted) throw new Error(t('legal.providerAcceptRequired'))
      const detail = detailQuery.data
      if (!detail?.branch?.addressLine) throw new Error('Add a branch address before submitting.')
      const required = (requirementsQuery.data ?? []).filter((r) => r.isRequired)
      for (const req of required) {
        const has = detail.documents.some((d) => d.documentRequirementId === req.id)
        if (!has) throw new Error(`Upload required document: ${req.displayName}`)
      }
      await recordLegalAcceptance({
        ...PROVIDER_ACCEPTANCE,
      })
      await updateBusinessApplication(applicationId, { currentStep: 'review_and_submit' })
      return submitBusinessApplication(applicationId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-business-applications'] })
      void detailQuery.refetch()
      setError('')
    },
    onError: (err: Error) => setError(err.message),
  })

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawBusinessApplication(applicationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-business-applications'] })
      void detailQuery.refetch()
    },
    onError: (err: Error) => setError(err.message),
  })

  const docsByRequirement = useMemo(() => {
    const result = new Map<string, NonNullable<typeof detailQuery.data>['documents'][number]>()
    for (const doc of detailQuery.data?.documents ?? []) {
      result.set(doc.documentRequirementId, doc)
    }
    return result
  }, [detailQuery.data])

  if (!isNew && detailQuery.isLoading) return <Spinner />

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <Link to="/business/applications" className="text-sm text-primary">
        ← Applications
      </Link>
      <h2 className="text-xl font-semibold">{isNew ? 'New garage application' : displayName || 'Application'}</h2>
      {app && (
        <p className="text-sm capitalize text-text-muted">Status: {app.status.replaceAll('_', ' ')}</p>
      )}
      {app?.status === 'changes_requested' && app.changesRequestedReason && (
        <p className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          Changes requested: {app.changesRequestedReason}
        </p>
      )}
      {app?.status === 'approved' && app.createdBusinessId && (
        <Link
          to={`/business/garages/${app.createdBusinessId}/setup`}
          className="block rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success"
        >
          Approved — continue to Garage setup →
        </Link>
      )}

      <div className="flex flex-wrap gap-1 text-xs">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={!editable && s.id !== step}
            onClick={() => editable && setStep(s.id)}
            className={`rounded-full px-2.5 py-1 ${step === s.id ? 'bg-primary text-white' : 'bg-surface-secondary text-text-muted'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {step === 'business_information' && (
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Business category</span>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={categoryId}
              disabled={!editable}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select…</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Legal name"
            value={legalName}
            disabled={!editable}
            onChange={(e) => setLegalName(e.target.value)}
          />
          <Input
            label="Display name"
            value={displayName}
            disabled={!editable}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Commercial registration (optional)"
            value={crNumber}
            disabled={!editable}
            onChange={(e) => setCrNumber(e.target.value)}
          />
          <Input
            label="Phone"
            value={phone}
            disabled={!editable}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            disabled={!editable}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              disabled={!editable}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {editable && (
            <Button
              loading={saveBusinessMutation.isPending}
              disabled={
                !categoryId ||
                legalName.trim().length < 2 ||
                displayName.trim().length < 2 ||
                !phone.trim() ||
                !email.trim()
              }
              onClick={() => saveBusinessMutation.mutate()}
            >
              Save & continue
            </Button>
          )}
        </div>
      )}

      {step === 'contact_information' && !isNew && (
        <div className="space-y-3">
          <Input
            label="Phone"
            value={phone}
            disabled={!editable}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            disabled={!editable}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Website (optional)"
            value={website}
            disabled={!editable}
            onChange={(e) => setWebsite(e.target.value)}
          />
          {editable && (
            <Button loading={saveContactMutation.isPending} onClick={() => saveContactMutation.mutate()}>
              Save & continue
            </Button>
          )}
        </div>
      )}

      {step === 'branch_information' && !isNew && (
        <div className="space-y-3">
          <Input
            label="Address"
            value={addressLine}
            disabled={!editable}
            onChange={(e) => setAddressLine(e.target.value)}
          />
          <Input label="Area" value={area} disabled={!editable} onChange={(e) => setArea(e.target.value)} />
          <Input label="City" value={city} disabled={!editable} onChange={(e) => setCity(e.target.value)} />
          <p className="text-xs text-text-muted">
            You will pin the exact map location in Garage setup after approval.
          </p>
          {editable && (
            <Button loading={saveBranchMutation.isPending} onClick={() => saveBranchMutation.mutate()}>
              Save & continue
            </Button>
          )}
        </div>
      )}

      {step === 'documents' && !isNew && (
        <div className="space-y-4">
          {(requirementsQuery.data ?? []).map((req) => {
            const existing = docsByRequirement.get(req.id)
            return (
              <div key={req.id} className="rounded-xl border border-border bg-surface p-3">
                <p className="font-medium text-sm">
                  {req.displayName}
                  {req.isRequired ? ' *' : ''}
                </p>
                {req.description && <p className="mt-1 text-xs text-text-muted">{req.description}</p>}
                {existing ? (
                  <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                    <span>
                      {existing.originalFileName}{' '}
                      <span className="text-text-muted">({existing.status})</span>
                    </span>
                    {editable && (
                      <button
                        type="button"
                        className="text-error"
                        onClick={() => deleteDocMutation.mutate(existing.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  editable && (
                    <input
                      type="file"
                      accept={req.allowedMimeTypes.join(',')}
                      className="mt-2 block w-full text-sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > req.maximumFileSizeBytes) {
                          setError(`File too large for ${req.displayName}`)
                          return
                        }
                        uploadMutation.mutate({ requirementId: req.id, file })
                      }}
                    />
                  )
                )}
              </div>
            )
          })}
          {editable && (
            <Button
              onClick={() => {
                setStep('review_and_submit')
                void updateBusinessApplication(applicationId, { currentStep: 'review_and_submit' })
              }}
            >
              Continue to submit
            </Button>
          )}
        </div>
      )}

      {step === 'review_and_submit' && !isNew && (
        <div className="space-y-4">
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-text-muted">Legal name</dt>
              <dd>{legalName}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Display name</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Contact</dt>
              <dd>
                {phone} · {email}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Address</dt>
              <dd>
                {[addressLine, area, city].filter(Boolean).join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">Documents</dt>
              <dd>{detailQuery.data?.documents.length ?? 0} uploaded</dd>
            </div>
          </dl>

          {editable && (
            <>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={providerAccepted}
                  onChange={(e) => setProviderAccepted(e.target.checked)}
                />
                <span>
                  {t('legal.providerAccept')}{' '}
                  <Link to="/legal/provider" className="text-primary" target="_blank">
                    {t('legal.providerAgreementLink')}
                  </Link>
                </span>
              </label>
              <Button loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
                Submit application
              </Button>
            </>
          )}

          {app && (app.status === 'draft' || app.status === 'submitted' || app.status === 'changes_requested') && (
            <Button
              variant="danger"
              loading={withdrawMutation.isPending}
              onClick={() => withdrawMutation.mutate()}
            >
              Withdraw
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
