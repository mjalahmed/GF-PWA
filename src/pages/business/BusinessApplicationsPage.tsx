import { ProtectedRoute } from '../../components/ui/ProtectedRoute'

export function BusinessApplicationsPage() {
  return (
    <ProtectedRoute>
      <section>
        <h2>Business applications</h2>
        <p>Track and manage your garage onboarding applications here.</p>
      </section>
    </ProtectedRoute>
  )
}
