import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import { listAdminApplications, listAdminDisputes, listAdminReviews } from '../../services/api/admin'

export function AdminDashboardPage() {
  const [stats, setStats] = useState({ applications: 0, disputes: 0, reviews: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listAdminApplications({ status: 'submitted', pageSize: 50 }),
      listAdminDisputes(),
      listAdminReviews(),
    ])
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
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <h2 className="text-xl font-semibold">Platform overview</h2>
      <ul className="space-y-2 text-sm">
        <li>
          Submitted applications: {stats.applications}{' '}
          <Link to="/admin/applications" className="text-primary">
            Review →
          </Link>
        </li>
        <li>Open disputes: {stats.disputes}</li>
        <li>Reviews to moderate: {stats.reviews}</li>
      </ul>
    </section>
  )
}
