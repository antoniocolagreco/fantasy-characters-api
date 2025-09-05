import type { ErrorCode, ErrorDetail } from '@/shared/schemas'

const DEFAULT_STATUS: Record<ErrorCode, number> = {
    INVALID_CREDENTIALS: 401,
    EMAIL_ALREADY_EXISTS: 409,
    TOKEN_EXPIRED: 401,
    TOKEN_INVALID: 401,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    VALIDATION_ERROR: 400,
    REQUIRED_FIELD_MISSING: 400,
    INVALID_FORMAT: 400,
    VALUE_OUT_OF_RANGE: 400,
    INVALID_TYPE: 400,
    RESOURCE_NOT_FOUND: 404,
    RESOURCE_CONFLICT: 409,
    RESOURCE_LOCKED: 423,
    RESOURCE_EXPIRED: 410,
    INVALID_FILE_FORMAT: 400,
    FILE_TOO_LARGE: 413,
    FILE_CORRUPTED: 400,
    UPLOAD_FAILED: 500,
    OPERATION_NOT_ALLOWED: 400,
    INSUFFICIENT_RESOURCES: 400,
    DEPENDENCY_CONFLICT: 409,
    BUSINESS_RULE_VIOLATION: 422,
    DATABASE_ERROR: 500,
    CASCADE_DELETE_ERROR: 409,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    EXTERNAL_SERVICE_ERROR: 502,
    RATE_LIMIT_EXCEEDED: 429,
    QUOTA_EXCEEDED: 429,
    CONCURRENT_LIMIT_EXCEEDED: 429,
}

export class AppError extends Error {
    readonly code: ErrorCode
    readonly status: number
    readonly details?: ErrorDetail[]

    constructor(code: ErrorCode, message: string, details?: ErrorDetail[], status?: number) {
        super(message)
        this.name = 'AppError'
        this.code = code
        this.status = status ?? DEFAULT_STATUS[code]
        if (details !== undefined) {
            this.details = details
        }
    }
}

export function err(code: ErrorCode, message?: string, details?: ErrorDetail[]): AppError {
    return new AppError(code, message ?? code, details)
}
