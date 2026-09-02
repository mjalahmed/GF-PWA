import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Spinner } from '../../components/ui/Spinner'
import {
  approveApplication,
  getAdminApplication,
  rejectApplication,
  requestApplicationChanges,
  reviewApplicationDocument,
  startApplicationReview,
} from '../../services/api/admin'

export function AdminApplicationDetailPage() {
  const { applicationId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const detailQuery = useQuery({
    queryKey: ['admin-application', applicationId],
    queryFn: () => getAdminApplication(applicationId),
    enabled: Boolean(applicationId),
  })

  const invalidate = () => {
    void detailQuery.refetch()
    void queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
  }

  const startMutation = useMutation({
    mutationFn: () => startApplicationReview(applicationId),
    onSuccess: () => {
      setMessage('Review started.')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const docMutation = useMutation({
    mutationFn: ({
      documentId,
      status,
    }: {
      documentId: string
      status: 'approved' | 'rejected'
    }) =>
      reviewApplicationDocument(applicationId, documentId, {
        status,
        rejectionReason: status === 'rejected' ? reason || 'Document rejected' : null,
      }),
    onSuccess: () => {
      setMessage('Document updated.')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const changesMutation = useMutation({
    mutationFn: () => {
      if (reason.trim().length < 5) throw new Error('Reason must be at least 5 characters.')
      return requestApplicationChanges(applicationId, reason.trim())
    },
    onSuccess: () => {
      setMessage('Changes requested.')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (reason.trim().length < 5) throw new Error('Reason must be at least 5 characters.')
      return rejectApplication(applicationId, reason.trim())
    },
    onSuccess: () => {
      setMessage('Application rejected.')
      invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const approveMutation = useMutation({
    mutationFn: () => approveApplication(applicationId),
    onSuccess: (result) => {
      setMessage('Approved.')
      invalidate()
      navigate(`/admin/businesses/${result.businessId}/setup`)
    },
    onError: (err: Error) => setError(err.message),
  })

  if (detailQuery.isLoading) return <Spinner />
  if (!detailQuery.data) {
    return <p className="p-4 text-error">Application not found.</p>
  }

  const { application, branch, documents, requirements } = detailQuery.data
  const requiredOk = requirements
    .filter((r) => r.isRequired)
    .every((r) => documents.some((d) => d.documentRequirementId === r.id && d.status === 'approved'))

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <Link to="/admin/applications" className="text-sm text-primary">
        ← Queue
      </Link>
      <h2 className="text-xl font-semibold">{application.displayName}</h2>
      <p className="text-sm capitalize text-text-muted">{application.status.replaceAll('_', ' ')}</p>

      <dl className="space-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
        <div>
          <dt className="text-text-muted">Legal name</dt>
          <dd>{application.legalName}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Contact</dt>
          <dd>
            {application.phone} · {application.email}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Address</dt>
          <dd>
            {[branch?.addressLine, branch?.area, branch?.city].filter(Boolean).join(', ') || '—'}
          </dd>
        </div>
        {application.commercialRegistrationNumber && (
          <div>
            <dt className="text-text-muted">CR number</dt>
            <dd>{application.commercialRegistrationNumber}</dd>
          </div>
        )}
      </dl>

      {error && <p className="text-sm text-error">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}

      <div className="space-y-2">
        <h3 className="font-semibold">Documents</h3>
        {documents.length === 0 && <p className="text-sm text-text-muted">No documents uploaded.</p>}
        {documents.map((doc) => {
          const req = requirements.find((r) => r.id === doc.documentRequirementId)
          return (
            <div key={doc.id} className="rounded-xl border border-border bg-surface p-3 text-sm">
              <p className="font-medium">{req?.displayName ?? doc.documentType}</p>
              <p className="text-text-muted">
                {doc.originalFileName} · {doc.status}
              </p>
              {doc.status === 'pending' || doc.status === 'under_review' ? (
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => docMutation.mutate({ documentId: doc.id, status: 'approved' })}
                  >
                    Approve doc
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => docMutation.mutate({ documentId: doc.id, status: 'rejected' })}
                  >
                    Reject doc
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => docMutation.mutate({ documentId: doc.id, status: 'approved' })}
                  >
                    Mark approved
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Reason (for changes / reject / doc reject)</span>
        <textarea
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {application.status === 'submitted' && (
          <Button loading={startMutation.isPending} onClick={() => startMutation.mutate()}>
            Start review
          </Button>
        )}
        {(application.status === 'submitted' || application.status === 'under_review') && (
          <>
            <Button
              variant="secondary"
              loading={changesMutation.isPending}
              onClick={() => changesMutation.mutate()}
            >
              Request changes
            </Button>
            <Button
              variant="danger"
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              Reject
            </Button>
            <Button
              loading={approveMutation.isPending}
              disabled={!requiredOk}
              onClick={() => approveMutation.mutate()}
            >
              Approve
            </Button>
          </>
        )}
      </div>

      {!requiredOk && (
        <p className="text-xs text-warning">Approve all required documents before approving the application.</p>
      )}

      {application.createdBusinessId && (
        <Link
          to={`/admin/businesses/${application.createdBusinessId}/setup`}
          className="inline-block text-sm text-primary"
        >
          Configure garage setup →
        </Link>
      )}
    </section>
  )
}
