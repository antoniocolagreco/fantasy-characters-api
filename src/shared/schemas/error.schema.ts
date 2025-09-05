import { type Static, Type } from '@sinclair/typebox'

// Error codes schema
export const ErrorCodeSchema = Type.Union(
    [
        Type.Literal('INVALID_CREDENTIALS'), // 401
        Type.Literal('EMAIL_ALREADY_EXISTS'), // 409
        Type.Literal('TOKEN_EXPIRED'), // 401
        Type.Literal('TOKEN_INVALID'), // 401
        Type.Literal('UNAUTHORIZED'), // 401
        Type.Literal('FORBIDDEN'), // 403
        Type.Literal('VALIDATION_ERROR'), // 400
        Type.Literal('REQUIRED_FIELD_MISSING'), // 400
        Type.Literal('INVALID_FORMAT'), // 400
        Type.Literal('VALUE_OUT_OF_RANGE'), // 400
        Type.Literal('INVALID_TYPE'), // 400
        Type.Literal('RESOURCE_NOT_FOUND'), // 404
        Type.Literal('RESOURCE_CONFLICT'), // 409
        Type.Literal('RESOURCE_LOCKED'), // 423
        Type.Literal('RESOURCE_EXPIRED'), // 410
        Type.Literal('INVALID_FILE_FORMAT'), // 400
        Type.Literal('FILE_TOO_LARGE'), // 413
        Type.Literal('FILE_CORRUPTED'), // 400
        Type.Literal('UPLOAD_FAILED'), // 500
        Type.Literal('OPERATION_NOT_ALLOWED'), // 400
        Type.Literal('INSUFFICIENT_RESOURCES'), // 400
        Type.Literal('DEPENDENCY_CONFLICT'), // 409
        Type.Literal('BUSINESS_RULE_VIOLATION'), // 422
        Type.Literal('DATABASE_ERROR'), // 500
        Type.Literal('CASCADE_DELETE_ERROR'), // 409
        Type.Literal('INTERNAL_SERVER_ERROR'), // 500
        Type.Literal('SERVICE_UNAVAILABLE'), // 503
        Type.Literal('EXTERNAL_SERVICE_ERROR'), // 502
        Type.Literal('RATE_LIMIT_EXCEEDED'), // 429
        Type.Literal('QUOTA_EXCEEDED'), // 429
        Type.Literal('CONCURRENT_LIMIT_EXCEEDED'), // 429
    ],
    { $id: 'ErrorCode' }
)

// Error detail schema
export const ErrorDetailSchema = Type.Object(
    {
        path: Type.Optional(Type.String()),
        field: Type.Optional(Type.String()),
        message: Type.Optional(Type.String()),
    },
    { $id: 'ErrorDetail' }
)

// Error response schema
export const ErrorResponseSchema = Type.Object(
    {
        error: Type.Object({
            code: ErrorCodeSchema,
            message: Type.String(),
            status: Type.Integer(),
            details: Type.Optional(Type.Array(ErrorDetailSchema)),
            method: Type.Optional(Type.String()),
            path: Type.Optional(Type.String()),
        }),
        requestId: Type.Optional(Type.String()),
        timestamp: Type.Optional(Type.String({ format: 'date-time' })),
    },
    { $id: 'ErrorResponse' }
)

// Extract TypeScript types from schemas
export type ErrorCode = Static<typeof ErrorCodeSchema>
export type ErrorDetail = Static<typeof ErrorDetailSchema>
export type ErrorResponse = Static<typeof ErrorResponseSchema>
