export interface ApiErrorPayload {
  code: string
  message: string
  details?: unknown
}

export interface ApiPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ApiMeta {
  requestId: string
  pagination?: ApiPagination
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T | null
  error: ApiErrorPayload | null
  meta: ApiMeta | null
}

export class ApiException extends Error {
  readonly code: string
  readonly details?: unknown
  readonly statusCode: number

  constructor(code: string, message: string, statusCode = 500, details?: unknown) {
    super(message)
    this.name = 'ApiException'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export interface PaginatedResult<T> {
  items: T[]
  pagination?: ApiPagination
}
