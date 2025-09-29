# Error Handling

Centralized error handling implementation for Fastify + TypeScript.

## Error Response Format

Standard error envelope that integrates with
[response-templates.md](./response-templates.md) patterns:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Character not found",
    "status": 404,
    "details": [{ "path": "/params/id", "message": "must be integer" }],
    "method": "GET",
    "path": "/v1/characters/123"
  },
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

## Error Codes

```typescript
export type ErrorCode =
  | 'INVALID_CREDENTIALS' // 401
  | 'EMAIL_ALREADY_EXISTS' // 409
  | 'TOKEN_EXPIRED' // 401
  | 'TOKEN_INVALID' // 401
  | 'UNAUTHORIZED' // 401
  | 'FORBIDDEN' // 403
  | 'VALIDATION_ERROR' // 400
  | 'REQUIRED_FIELD_MISSING' // 400
  | 'INVALID_FORMAT' // 400
  | 'VALUE_OUT_OF_RANGE' // 400
  | 'INVALID_TYPE' // 400
  | 'RESOURCE_NOT_FOUND' // 404
  | 'RESOURCE_CONFLICT' // 409
  | 'RESOURCE_IN_USE' // 409
  | 'RESOURCE_LOCKED' // 423
  | 'RESOURCE_EXPIRED' // 410
  | 'INVALID_FILE_FORMAT' // 400
  | 'FILE_TOO_LARGE' // 413
  | 'FILE_CORRUPTED' // 400
  | 'UPLOAD_FAILED' // 500
  | 'OPERATION_NOT_ALLOWED' // 400
  | 'INSUFFICIENT_RESOURCES' // 400
  | 'DEPENDENCY_CONFLICT' // 409
  | 'BUSINESS_RULE_VIOLATION' // 422
  | 'DATABASE_ERROR' // 500
  | 'CASCADE_DELETE_ERROR' // 409
  | 'INTERNAL_SERVER_ERROR' // 500
  | 'SERVICE_UNAVAILABLE' // 503
  | 'EXTERNAL_SERVICE_ERROR' // 502
  | 'RATE_LIMIT_EXCEEDED' // 429
  | 'QUOTA_EXCEEDED' // 429
  | 'CONCURRENT_LIMIT_EXCEEDED' // 429
```

## Implementation

### Types

```typescript
// src/shared/schemas/error.schema.ts
export const ErrorDetailSchema = Type.Object(
  {
    path: Type.Optional(Type.String()),
    field: Type.Optional(Type.String()),
    message: Type.Optional(Type.String()),
  },
  { $id: 'ErrorDetail' }
)

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

// Extract TypeScript types
export type ErrorDetail = Static<typeof ErrorDetailSchema>
export type ErrorResponse = Static<typeof ErrorResponseSchema>
```

### AppError Class

```typescript
// src/shared/errors/app.error.ts
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
  RESOURCE_IN_USE: 409,
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

  constructor(
    code: ErrorCode,
    message: string,
    details?: ErrorDetail[],
    status?: number
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status ?? DEFAULT_STATUS[code] ?? 500
    if (details !== undefined) {
      this.details = details
    }
  }
}

export function err(
  code: ErrorCode,
  message?: string,
  details?: ErrorDetail[]
): AppError {
  return new AppError(code, message ?? code, details)
}
```

### Error Normalization

**Note**: The `normalizeError` function and related type guards are implemented
directly in the error handler plugin
(`src/shared/plugins/error-handler.plugin.ts`) rather than as separate utility
files.

```typescript
// Implementation is integrated into src/shared/plugins/error-handler.plugin.ts
// Validation errors, Prisma errors, JWT errors, and generic errors
// are handled directly in the errorHandlerPlugin function
```

### Response Formatter

**Note**: Response formatting is handled directly in the error handler plugin
(`src/shared/plugins/error-handler.plugin.ts`) rather than as a separate utility
file.

```typescript
// Response formatting is integrated into src/shared/plugins/error-handler.plugin.ts
// Error responses are formatted directly in the errorHandlerPlugin function
// following the ErrorResponse schema structure
```

### Error Plugin

```typescript
// src/shared/plugins/error-handler.plugin.ts
import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import { AppError } from '@/shared/errors/app.error'
import type { ErrorDetail, ErrorResponse } from '@/shared/schemas'

export function errorHandlerPlugin(fastify: FastifyInstance): void {
  // Handle 404 not found errors
  fastify.setNotFoundHandler(
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = request.id
      const timestamp = new Date().toISOString()

      const errorResponse: ErrorResponse = {
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: `Route ${request.method}:${request.url} not found`,
          status: 404,
          method: request.method,
          path: request.url,
        },
        requestId,
        timestamp,
      }

      request.log.warn({ error: errorResponse }, 'Route not found')
      return reply.status(404).send(errorResponse)
    }
  )

  fastify.setErrorHandler(
    async (
      error: FastifyError,
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      const requestId = request.id
      const timestamp = new Date().toISOString()

      // Handle validation errors
      if (error.validation) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            status: 400,
            details: error.validation.map(issue => ({
              path: issue.instancePath || issue.schemaPath || '',
              field: issue.instancePath?.split('/').pop(),
              message: issue.message,
            })),
            method: request.method,
            path: request.url,
          },
          requestId,
          timestamp,
        }
        return reply.status(400).send(errorResponse)
      }

      // Handle AppError instances
      if (error instanceof AppError) {
        const errorResponse: ErrorResponse = {
          error: {
            code: error.code,
            message: error.message,
            status: error.status,
            ...(error.details && { details: error.details }),
            method: request.method,
            path: request.url,
          },
          requestId,
          timestamp,
        }
        return reply.status(error.status).send(errorResponse)
      }

      // Handle generic errors
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          status: 500,
          method: request.method,
          path: request.url,
        },
        requestId,
        timestamp,
      }
      return reply.status(500).send(errorResponse)
    }
  )
}
```

## TypeBox Schemas

```typescript
// src/shared/schemas/error.schema.ts
import { type Static, Type } from '@sinclair/typebox'

export const ErrorCodeSchema = Type.String({
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

export const ErrorDetailSchema = Type.Object({
  path: Type.Optional(Type.String()),
  field: Type.Optional(Type.String()),
  message: Type.Optional(Type.String()),
})

export const ErrorResponseSchema = Type.Object({
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
})

// Extract TypeScript types
export type ErrorCode = Static<typeof ErrorCodeSchema>
export type ErrorDetail = Static<typeof ErrorDetailSchema>
export type ErrorResponse = Static<typeof ErrorResponseSchema>
```

## Usage

```typescript
// Business logic
if (!character) throw err('RESOURCE_NOT_FOUND', 'Character not found')

// Authorization
if (character.userId !== request.user.id) {
  throw err('FORBIDDEN', 'You can only access your own characters')
}

// Route schemas - import from centralized schemas
import { ErrorResponseSchema } from '@/shared/schemas'

app.get(
  '/characters/:id',
  {
    schema: {
      response: {
        200: CharacterResponseSchema,
        400: ErrorResponseSchema,
        401: ErrorResponseSchema,
        403: ErrorResponseSchema,
        404: ErrorResponseSchema,
        500: ErrorResponseSchema,
      },
    },
  },
  handler
)
```

## App Setup

```typescript
// src/app.ts
import { errorHandlerPlugin } from '@/shared/plugins/error-handler.plugin'

const app = Fastify({ logger: true })

// Register error plugin FIRST (before other plugins)
errorHandlerPlugin(app)

// Then register other plugins...
```
