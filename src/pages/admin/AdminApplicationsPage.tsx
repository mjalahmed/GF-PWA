import { ProtectedRoute } from '../../components/ui/ProtectedRoute'

export function AdminApplicationsPage() {
  return (
    <ProtectedRoute>
      <section>
        <h2>Application review queue</h2>
        <p>Review, approve, or reject new garage applications.</p>
      </section>
    </ProtectedRoute>
  )
}
