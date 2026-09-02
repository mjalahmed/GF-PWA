import {
  getBusinessSettings,
  getOpeningHours,
  listBusinessBranches,
  listBusinessServices,
} from '../services/api/business'
import { evaluateSetupChecklist, type SetupChecklist } from './garageSetup'

export async function fetchGarageSetupChecklist(businessId: string): Promise<SetupChecklist> {
  const [branches, hours, services, settings] = await Promise.all([
    listBusinessBranches(businessId),
    getOpeningHours(businessId),
    listBusinessServices(businessId),
    getBusinessSettings(businessId),
  ])
  const primary = branches.find((b) => b.isPrimary) ?? branches[0] ?? null
  return evaluateSetupChecklist({
    branch: primary,
    hours,
    services,
    settings,
  })
}
