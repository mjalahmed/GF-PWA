import { useParams } from 'react-router-dom'
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
    <GarageSetupForm businessId={businessId} backTo="/admin/applications" requireComplete={false} />
  )
}
