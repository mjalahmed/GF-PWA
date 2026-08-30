import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader title="Not found" />
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-6xl">🔧</p>
        <h2 className="mt-4 text-xl font-semibold text-text-primary">Page not found</h2>
        <p className="mt-2 text-sm text-text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Button className="mt-8" onClick={() => navigate('/')}>
          Go home
        </Button>
        <p className="mt-4">
          <Link to="/search" className="text-sm text-primary">
            Search garages
          </Link>
        </p>
      </div>
    </div>
  )
}
