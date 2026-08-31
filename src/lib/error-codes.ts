export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PROFILE_SUSPENDED: 'PROFILE_SUSPENDED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  RATE_LIMITED: 'RATE_LIMITED',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

const MESSAGE_KEYS: Record<string, string> = {
  AUTH_REQUIRED: 'auth.required',
  PERMISSION_DENIED: 'auth.permission',
  RESOURCE_NOT_FOUND: 'auth.notFound',
  VALIDATION_ERROR: 'auth.validation',
  INTERNAL_ERROR: 'auth.internal',
  PROFILE_SUSPENDED: 'auth.suspended',
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  RATE_LIMITED: 'auth.rateLimited',
}

/** @deprecated Prefer userMessageKey + t() for localized UI. */
export function userMessage(code: string, fallback?: string): string {
  const key = MESSAGE_KEYS[code]
  // English fallback for non-React callers / tests
  const en: Record<string, string> = {
    'auth.required': 'You must be signed in to continue.',
    'auth.permission': 'You do not have permission to perform this action.',
    'auth.notFound': 'The requested resource was not found.',
    'auth.validation': 'Please check your input and try again.',
    'auth.internal': 'Something went wrong. Please try again.',
    'auth.suspended': 'Your account has been suspended.',
    'auth.invalidCredentials': 'Invalid email or password.',
    'auth.rateLimited': 'Too many requests. Please try again later.',
  }
  return (key && en[key]) || fallback || en['auth.internal']
}

export function userMessageKey(code: string): string {
  return MESSAGE_KEYS[code] ?? 'auth.internal'
}
