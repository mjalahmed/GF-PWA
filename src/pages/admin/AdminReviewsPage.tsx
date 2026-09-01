import { ProtectedRoute } from '../../components/ui/ProtectedRoute'

export function AdminReviewsPage() {
  return (
    <ProtectedRoute>
      <section>
        <h2>Review moderation</h2>
        <p>Hide, restore, or remove reviews and handle reports.</p>
      </section>
    </ProtectedRoute>
  )
}
