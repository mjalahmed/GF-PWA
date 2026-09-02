import type { BusinessBranch, BusinessService, BusinessSettings, OpeningHoursDay } from '../types/onboarding'

export type SetupChecklist = {
  hasLocation: boolean
  hasHours: boolean
  hasService: boolean
  appointmentsEnabled: boolean
  complete: boolean
}

export function evaluateSetupChecklist(input: {
  branch: BusinessBranch | null | undefined
  hours: OpeningHoursDay[]
  services: BusinessService[]
  settings: BusinessSettings | null | undefined
}): SetupChecklist {
  const hasLocation = Boolean(
    input.branch?.addressLine?.trim() &&
      input.branch.latitude != null &&
      input.branch.longitude != null,
  )
  const hasHours = input.hours.length > 0
  const hasService = input.services.some((s) => s.isActive !== false)
  const appointmentsEnabled = Boolean(input.settings?.appointmentsEnabled)
  return {
    hasLocation,
    hasHours,
    hasService,
    appointmentsEnabled,
    complete: hasLocation && hasHours && hasService && appointmentsEnabled,
  }
}
