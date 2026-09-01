import { useEffect, useState } from 'react'
import { ProtectedRoute } from '../../components/ui/ProtectedRoute'
import { Spinner } from '../../components/ui/Spinner'
import { listAdminApplications, listAdminDisputes, listAdminReviews } from '../../services/api/admin'

export function AdminDashboardPage() {
  const [stats, setStats] = useState({ applications: 0, disputes: 0, reviews: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listAdminApplications(), listAdminDisputes(), listAdminReviews()])
      .then(([applications, disputes, reviews]) => {
        setStats({
          applications: applications.length,
          disputes: disputes.length,
          reviews: reviews.length,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <ProtectedRoute>
      <section>
        <h2>Platform overview</h2>
        <ul>
          <li>Pending applications: {stats.applications}</li>
          <li>Open disputes: {stats.disputes}</li>
          <li>Reviews to moderate: {stats.reviews}</li>
        </ul>
      </section>
    </ProtectedRoute>
  )
}
