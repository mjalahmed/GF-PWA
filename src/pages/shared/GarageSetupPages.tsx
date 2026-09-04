import { useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { GarageSetupForm } from '../../components/business/GarageSetupForm'

export function BusinessGarageSetupPage() {
  const { businessId = '' } = useParams()
  return (
    <GarageSetupForm
      businessId={businessId}
      backTo={`/business/garages/${businessId}`}
      requireComplete
    />
  )
}

export function AdminGarageSetupPage() {
  const { businessId = '' } = useParams()
  return (
    <div>
      <div className="mx-auto max-w-lg px-4 pt-4">
        <Link
          to={`/admin/businesses/${businessId}/capabilities`}
          className="text-sm font-medium text-primary"
        >
          Edit capabilities →
        </Link>
      </div>
      <GarageSetupForm businessId={businessId} backTo="/admin/applications" requireComplete={false} />
    </div>
  )
}
