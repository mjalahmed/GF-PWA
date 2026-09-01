import { ProtectedRoute } from '../../components/ui/ProtectedRoute'

export function BusinessAppointmentsPage() {
  return (
    <ProtectedRoute>
      <section>
        <h2>Garage appointments</h2>
        <p>Confirm, schedule, and complete customer appointments from this view.</p>
      </section>
    </ProtectedRoute>
  )
}
