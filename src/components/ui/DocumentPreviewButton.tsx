import { useState } from 'react'
import { Button } from './Button'
import { supabase } from '../../lib/supabase'

const APPLICATION_DOCS_BUCKET = 'business-application-documents'

type Props = {
  storagePath: string
  fileName: string
  mimeType?: string
}

export function DocumentPreviewButton({ storagePath, fileName, mimeType }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openDocument = async () => {
    setError('')
    setLoading(true)
    try {
      const { data, error: signedError } = await supabase.storage
        .from(APPLICATION_DOCS_BUCKET)
        .createSignedUrl(storagePath, 3600)
      if (signedError || !data?.signedUrl) {
        throw new Error(signedError?.message || 'Could not create a view link for this document.')
      }
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button variant="secondary" loading={loading} onClick={() => void openDocument()}>
        View {mimeType?.includes('pdf') ? 'PDF' : 'file'}
      </Button>
      {error && <p className="text-xs text-error">{error}</p>}
      <p className="text-[10px] text-text-subtle truncate" title={fileName}>
        {fileName}
      </p>
    </div>
  )
}
