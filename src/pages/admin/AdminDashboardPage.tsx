import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Spinner } from '../../components/ui/Spinner'
import {
  listAdminApplications,
  listAdminBusinesses,
  listAdminDisputes,
  listAdminReviews,
  listAdminUsers,
} from '../../services/api/admin'

function StatCard({
  label,
  value,
  to,
}: {
  label: string
  value: number | string
  to?: string
}) {
  const inner = (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-sm text-text-muted">{label}</p>
    </div>
  )
  return to ? (
    <Link to={to} className="block no-underline hover:border-primary">
      {inner}
    </Link>
  ) : (
    inner
  )
}

export function AdminDashboardPage() {
  const applicationsQuery = useQuery({
    queryKey: ['admin-applications', 'submitted'],
    queryFn: () => listAdminApplications({ status: 'submitted', pageSize: 50 }),
  })
  const underReviewQuery = useQuery({
    queryKey: ['admin-applications', 'under_review'],
    queryFn: () => listAdminApplications({ status: 'under_review', pageSize: 50 }),
  })
  const disputesQuery = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => listAdminDisputes(),
  })
  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => listAdminReviews(),
  })
  const usersQuery = useQuery({
    queryKey: ['admin-users', 'count'],
    queryFn: () => listAdminUsers({ pageSize: 1 }),
  })
  const businessesQuery = useQuery({
    queryKey: ['admin-businesses', 'count'],
    queryFn: () => listAdminBusinesses({ pageSize: 50 }),
  })

  const loading =
    applicationsQuery.isLoading ||
    disputesQuery.isLoading ||
    reviewsQuery.isLoading

  if (loading) return <Spinner />

  const openDisputes = (disputesQuery.data ?? []).filter((d) => {
    const s = String(d.status ?? '')
    return !['resolved', 'rejected', 'closed', 'withdrawn'].includes(s)
  }).length

  const flaggedReviews = (reviewsQuery.data ?? []).filter((r) => {
    const s = String(r.status ?? '')
    return ['flagged', 'pending', 'hidden'].includes(s)
  }).length

  return (
    <section className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <div>
        <h2 className="text-xl font-semibold">Control center</h2>
        <p className="text-sm text-text-muted">Platform moderation and onboarding overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Submitted applications"
          value={applicationsQuery.data?.length ?? 0}
          to="/admin/applications"
        />
        <StatCard
          label="Under review"
          value={underReviewQuery.data?.length ?? 0}
          to="/admin/applications"
        />
        <StatCard label="Open disputes" value={openDisputes} to="/admin/disputes" />
        <StatCard label="Reviews to moderate" value={flaggedReviews} to="/admin/reviews" />
        <StatCard
          label="Businesses"
          value={businessesQuery.data?.length ?? '—'}
          to="/admin/businesses"
        />
        <StatCard
          label="Users"
          value={usersQuery.data && usersQuery.data.length >= 0 ? 'Open' : '—'}
          to="/admin/users"
        />
      </div>

      <nav className="grid grid-cols-2 gap-2 text-sm">
        <Link to="/admin/applications" className="rounded-xl border border-border bg-surface px-3 py-3">
          Applications →
        </Link>
        <Link to="/admin/businesses" className="rounded-xl border border-border bg-surface px-3 py-3">
          Businesses →
        </Link>
        <Link to="/admin/users" className="rounded-xl border border-border bg-surface px-3 py-3">
          Users →
        </Link>
        <Link to="/admin/disputes" className="rounded-xl border border-border bg-surface px-3 py-3">
          Disputes →
        </Link>
        <Link to="/admin/reviews" className="rounded-xl border border-border bg-surface px-3 py-3">
          Reviews →
        </Link>
      </nav>
    </section>
  )
}
