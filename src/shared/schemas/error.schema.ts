import { type Static, Type } from '@sinclair/typebox'

// Error codes schema
export const ErrorCodeSchema = Type.String({
    $id: 'ErrorCode',
    title: 'Error Code',
    description: 'Standardized error codes for API responses',
    enum: [
        'INVALID_CREDENTIALS', // 401
        'EMAIL_ALREADY_EXISTS', // 409
        'TOKEN_EXPIRED', // 401
        'TOKEN_INVALID', // 401
        'UNAUTHORIZED', // 401
        'FORBIDDEN', // 403
        'VALIDATION_ERROR', // 400
        'REQUIRED_FIELD_MISSING', // 400
        'INVALID_FORMAT', // 400
        'VALUE_OUT_OF_RANGE', // 400
        'INVALID_TYPE', // 400
        'RESOURCE_NOT_FOUND', // 404
        'RESOURCE_CONFLICT', // 409
        'RESOURCE_IN_USE', // 409
        'RESOURCE_LOCKED', // 423
        'RESOURCE_EXPIRED', // 410
        'INVALID_FILE_FORMAT', // 400
        'FILE_TOO_LARGE', // 413
        'FILE_CORRUPTED', // 400
        'UPLOAD_FAILED', // 500
        'OPERATION_NOT_ALLOWED', // 400
        'INSUFFICIENT_RESOURCES', // 400
        'DEPENDENCY_CONFLICT', // 409
        'BUSINESS_RULE_VIOLATION', // 422
        'DATABASE_ERROR', // 500
        'CASCADE_DELETE_ERROR', // 409
        'INTERNAL_SERVER_ERROR', // 500
        'SERVICE_UNAVAILABLE', // 503
        'EXTERNAL_SERVICE_ERROR', // 502
        'RATE_LIMIT_EXCEEDED', // 429
        'QUOTA_EXCEEDED', // 429
        'CONCURRENT_LIMIT_EXCEEDED', // 429
    ],
})

// Error detail schema
export const ErrorDetailSchema = Type.Object(
    {
        path: Type.Optional(
            Type.String({
                description: 'The JSON path where the error occurred',
            })
        ),
        field: Type.Optional(
            Type.String({
                description: 'The field name that caused the error',
            })
        ),
        message: Type.Optional(
            Type.String({
                description: 'Additional details about the error',
            })
        ),
    },
    {
        $id: 'ErrorDetail',
        title: 'Error Detail',
        description: 'Additional information about a validation or field error',
    }
)

// Error response schema
export const ErrorResponseSchema = Type.Object(
    {
        error: Type.Object({
            code: ErrorCodeSchema,
            message: Type.String({
                description: 'Human-readable error message',
            }),
            status: Type.Integer({
                minimum: 100,
                maximum: 599,
                description: 'HTTP status code',
            }),
            details: Type.Optional(
                Type.Array(ErrorDetailSchema, {
                    description: 'Additional error details for validation errors',
                })
            ),
            method: Type.Optional(
                Type.String({
                    description: 'HTTP method that was used',
                })
            ),
            path: Type.Optional(
                Type.String({
                    description: 'API endpoint path that was called',
                })
            ),
        }),
        requestId: Type.Optional(
            Type.String({
                description: 'Unique identifier for this request',
            })
        ),
        timestamp: Type.Optional(
            Type.String({
                format: 'date-time',
                description: 'When the error occurred',
            })
        ),
    },
    {
        $id: 'ErrorResponse',
        title: 'Error Response',
        description: 'Standard error response format for all API endpoints',
    }
)

// Extract TypeScript types from schemas
export type ErrorCode = Static<typeof ErrorCodeSchema>
export type ErrorDetail = Static<typeof ErrorDetailSchema>
export type ErrorResponse = Static<typeof ErrorResponseSchema>
