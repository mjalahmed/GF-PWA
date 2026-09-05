import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { ImageUpload } from '../../components/ui/ImageUpload'
import { Input } from '../../components/ui/Input'
import { LocationPicker } from '../../components/ui/LocationPicker'
import { Spinner } from '../../components/ui/Spinner'
import { PROVIDER_ACCEPTANCE } from '../../legal'
import { googleMapsDirectionsUrl } from '../../lib/mapsLinks'
import { applicationMediaPath, uploadFile, uploadImage } from '../../lib/upload'
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

const STEP_IDS = [
  'business_information',
  'contact_information',
  'branch_information',
  'documents',
  'review_and_submit',
] as const

type StepId = (typeof STEP_IDS)[number]

const STEP_LABEL_KEYS: Record<StepId, string> = {
  business_information: 'biz.apply.steps.business',
  contact_information: 'biz.apply.steps.contact',
  branch_information: 'biz.apply.steps.branch',
  documents: 'biz.apply.steps.documents',
  review_and_submit: 'biz.apply.steps.submit',
}

function mimeForFile(file: File): 'application/pdf' | 'image/jpeg' | 'image/png' | null {
  if (file.type === 'application/pdf') return 'application/pdf'
  if (file.type === 'image/jpeg') return 'image/jpeg'
  if (file.type === 'image/png') return 'image/png'
  return null
}

export function BusinessApplicationWizardPage() {
  const { applicationId: applicationIdParam } = useParams()
  const applicationId = applicationIdParam?.trim() ?? ''
  const isNew = applicationId === 'new' || applicationId === ''
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
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [galleryPaths, setGalleryPaths] = useState<string[]>([])
  const [gallerySlot, setGallerySlot] = useState<string | null>(null)

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
    setLatitude(b?.latitude ?? null)
    setLongitude(b?.longitude ?? null)
    if (a.currentStep && STEP_IDS.includes(a.currentStep as StepId)) {
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
      const media = {
        logoPath: logoPath || null,
        galleryImagePaths: galleryPaths.length ? galleryPaths : null,
      }
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
          ...media,
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
        ...media,
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
      if (!addressLine.trim()) throw new Error(t('biz.apply.errors.branchAddressRequired'))
      if (latitude == null || longitude == null) {
        throw new Error(t('biz.apply.errors.pinLocationRequired'))
      }
      await updateApplicationBranch(applicationId, {
        name: displayName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        addressLine: addressLine.trim(),
        area: area.trim() || null,
        city: city.trim() || null,
        countryCode: 'BH',
        latitude,
        longitude,
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
      if (!mime) throw new Error(t('biz.apply.errors.fileTypeOnly'))
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
      if (!detail?.branch?.addressLine) throw new Error(t('biz.apply.errors.addBranchBeforeSubmit'))
      if (detail.branch.latitude == null || detail.branch.longitude == null) {
        throw new Error(t('biz.apply.errors.pinBeforeSubmit'))
      }
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
        ← {t('biz.nav.applications')}
      </Link>
      <h2 className="text-xl font-semibold">
        {isNew ? t('biz.apply.titles.newApplication') : displayName || t('biz.apply.titles.application')}
      </h2>
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
        {STEP_IDS.map((id) => (
          <button
            key={id}
            type="button"
            disabled={!editable && id !== step}
            onClick={() => editable && setStep(id)}
            className={`rounded-full px-2.5 py-1 ${step === id ? 'bg-primary text-white' : 'bg-surface-secondary text-text-muted'}`}
          >
            {t(STEP_LABEL_KEYS[id])}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {step === 'business_information' && (
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('biz.products.category')}</span>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={categoryId}
              disabled={!editable}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">{t('common.select')}</option>
              {(categoriesQuery.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label={t('biz.apply.labels.legalName')}
            value={legalName}
            disabled={!editable}
            onChange={(e) => setLegalName(e.target.value)}
          />
          <Input
            label={t('biz.apply.labels.displayName')}
            value={displayName}
            disabled={!editable}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label={t('biz.apply.labels.crOptional')}
            value={crNumber}
            disabled={!editable}
            onChange={(e) => setCrNumber(e.target.value)}
          />
          <Input
            label={t('biz.apply.labels.phone')}
            value={phone}
            disabled={!editable}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label={t('biz.apply.labels.email')}
            type="email"
            value={email}
            disabled={!editable}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('biz.apply.labels.description')}</span>
            <textarea
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              disabled={!editable}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {editable && (
            <>
              <ImageUpload
                bucket="business-media"
                label={t('biz.setup.logoOptional')}
                value={logoPath}
                onChange={setLogoPath}
                buildPath={(file) =>
                  applicationMediaPath(applicationId || 'new', 'logo', file.name)
                }
                onUpload={async (file, path) => {
                  await uploadImage('business-media', path, file)
                }}
                onRemove={() => setLogoPath(null)}
              />
              <ImageUpload
                bucket="business-media"
                label={t('biz.setup.garageImageOptional')}
                value={gallerySlot}
                onChange={(path) => {
                  setGallerySlot(path)
                  if (path) setGalleryPaths((prev) => [...prev, path].slice(0, 6))
                }}
                buildPath={(file) =>
                  applicationMediaPath(applicationId || 'new', 'gallery', file.name)
                }
                onUpload={async (file, path) => {
                  await uploadImage('business-media', path, file)
                }}
                onRemove={() => setGallerySlot(null)}
              />
              {galleryPaths.length > 0 && (
                <ul className="space-y-1 text-xs text-text-muted">
                  {galleryPaths.map((p) => (
                    <li key={p} className="flex items-center justify-between gap-2">
                      <span className="truncate">{p.split('/').pop()}</span>
                      <button
                        type="button"
                        className="text-error"
                        onClick={() => setGalleryPaths((prev) => prev.filter((x) => x !== p))}
                      >
                        {t('common.remove')}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
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
            label={t('biz.apply.labels.phone')}
            value={phone}
            disabled={!editable}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label={t('biz.apply.labels.email')}
            type="email"
            value={email}
            disabled={!editable}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t('biz.apply.labels.websiteOptional')}
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
            label={t('biz.apply.labels.address')}
            value={addressLine}
            disabled={!editable}
            onChange={(e) => setAddressLine(e.target.value)}
          />
          <Input
            label={t('biz.apply.labels.area')}
            value={area}
            disabled={!editable}
            onChange={(e) => setArea(e.target.value)}
          />
          <Input
            label={t('biz.apply.labels.city')}
            value={city}
            disabled={!editable}
            onChange={(e) => setCity(e.target.value)}
          />
          {editable ? (
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={({ latitude: lat, longitude: lng }) => {
                setLatitude(lat)
                setLongitude(lng)
              }}
            />
          ) : (
            <p className="text-sm text-text-muted">
              Pin:{' '}
              {latitude != null && longitude != null
                ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                : 'not set'}
            </p>
          )}
          {latitude != null && longitude != null && (
            <a
              href={googleMapsDirectionsUrl({
                latitude,
                longitude,
                label: displayName || 'Garage',
              })}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm text-primary"
            >
              Open pin in Google Maps
            </a>
          )}
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
              <dt className="text-text-muted">{t('biz.apply.labels.legalName')}</dt>
              <dd>{legalName}</dd>
            </div>
            <div>
              <dt className="text-text-muted">{t('biz.apply.labels.displayName')}</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt className="text-text-muted">{t('biz.apply.steps.contact')}</dt>
              <dd>
                {phone} · {email}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted">{t('biz.apply.labels.address')}</dt>
              <dd>
                {[addressLine, area, city].filter(Boolean).join(', ')}
                {latitude != null && longitude != null
                  ? ` · ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                  : ''}
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
