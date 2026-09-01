import { ProtectedRoute } from '../../components/ui/ProtectedRoute'

export function AdminDisputesPage() {
  return (
    <ProtectedRoute>
      <section>
        <h2>Dispute resolution</h2>
        <p>Assign, review, and resolve customer–business disputes.</p>
      </section>
    </ProtectedRoute>
  )
}
