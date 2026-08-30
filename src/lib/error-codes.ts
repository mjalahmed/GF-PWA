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

const USER_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: 'You must be signed in to continue.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  RESOURCE_NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  PROFILE_SUSPENDED: 'Your account has been suspended.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
}

export function userMessage(code: string, fallback?: string): string {
  return USER_MESSAGES[code] ?? fallback ?? USER_MESSAGES.INTERNAL_ERROR
}
