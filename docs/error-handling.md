# AI Error Handling Reference

Complete implementation guide for centralized error handling in Fastify +
TypeScript.

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
// src/common/types/error.types.ts
export interface ErrorDetail {
  path?: string
  field?: string
  message?: string
}

export interface ErrorResponse {
  error: {
    code: ErrorCode
    message: string
    status: number
    details?: ErrorDetail[]
    method?: string
    path?: string
  }
  requestId?: string
  timestamp?: string
}
```

### AppError Class

```typescript
// src/common/errors/app-error.ts
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

  constructor(
    code: ErrorCode,
    message: string,
    details?: ErrorDetail[],
    status?: number
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status ?? DEFAULT_STATUS[code]
    this.details = details
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

```typescript
// src/common/utils/normalize-error.ts
interface PrismaError {
  code: string
  meta?: { target?: string[] }
}

interface JWTError {
  name: string
}

interface FastifyValidationError {
  validation: Array<{
    instancePath?: string
    dataPath?: string
    message?: string
  }>
}

function isPrismaError(e: unknown): e is PrismaError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    typeof (e as PrismaError).code === 'string' &&
    (e as PrismaError).code.startsWith('P')
  )
}

function isJWTError(e: unknown): e is JWTError {
  return typeof e === 'object' && e !== null && 'name' in e
}

function isValidationError(e: unknown): e is FastifyValidationError {
  return typeof e === 'object' && e !== null && 'validation' in e
}

export function normalizeError(e: unknown): AppError {
  if (e instanceof AppError) return e

  if (isPrismaError(e)) {
    if (e.code === 'P2002') {
      if (e.meta?.target?.includes('email')) {
        return err('EMAIL_ALREADY_EXISTS', 'Email already exists')
      }
      return err('RESOURCE_CONFLICT', 'Unique constraint violation')
    }
    if (e.code === 'P2014')
      return err('CASCADE_DELETE_ERROR', 'Cannot delete due to dependencies')
    if (e.code === 'P2025') return err('RESOURCE_NOT_FOUND', 'Record not found')
    return err('DATABASE_ERROR', 'Database operation failed')
  }

  if (isJWTError(e)) {
    if (e.name === 'TokenExpiredError')
      return err('TOKEN_EXPIRED', 'Token has expired')
    if (e.name === 'JsonWebTokenError')
      return err('TOKEN_INVALID', 'Invalid token')
    return err('TOKEN_INVALID', 'Token error')
  }

  if (isValidationError(e)) {
    const details = e.validation.map(v => ({
      path: v.instancePath || v.dataPath || '',
      message: v.message || 'Invalid value',
    }))
    return err('VALIDATION_ERROR', 'Request validation failed', details)
  }

  return err('INTERNAL_SERVER_ERROR', 'Unexpected error occurred')
}
```

### Response Formatter

```typescript
// src/common/utils/format-error.ts
import type { FastifyRequest } from 'fastify'
import type { AppError } from '../errors/app-error'
import type { ErrorResponse } from '../types/error.types'

export function formatErrorResponse(
  error: AppError,
  request: FastifyRequest
): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details,
      method: request.method,
      path: request.url,
    },
    requestId: request.id,
    timestamp: new Date().toISOString(),
  }
}
```

### Error Plugin

```typescript
// src/plugins/error-handler.ts
import type { FastifyPluginAsync, FastifyInstance } from 'fastify'
import { AppError, err } from '../common/errors/app-error'
import { formatErrorResponse } from '../common/utils/format-error'
import { normalizeError } from '../common/utils/normalize-error'

export const errorPlugin: FastifyPluginAsync = async (
  fastify: FastifyInstance
) => {
  fastify.setNotFoundHandler((request, reply) => {
    const error = err('RESOURCE_NOT_FOUND', 'Resource not found')
    const response = formatErrorResponse(error, request)

    request.log.info(
      {
        requestId: request.id,
        code: error.code,
        path: request.url,
      },
      'Resource not found'
    )
    reply.code(error.status).send(response)
  })

  fastify.setErrorHandler((error, request, reply) => {
    const appError = normalizeError(error)
    const response = formatErrorResponse(appError, request)

    const logLevel =
      appError.status >= 500
        ? 'error'
        : ['UNAUTHORIZED', 'FORBIDDEN', 'INVALID_CREDENTIALS'].includes(
              appError.code
            )
          ? 'warn'
          : 'info'

    request.log[logLevel](
      {
        requestId: request.id,
        err: error,
        code: appError.code,
        status: appError.status,
      },
      `Request failed: ${appError.message}`
    )

    reply.code(appError.status).send(response)
  })
}
```

## TypeBox Schemas

```typescript
// src/common/schemas/error.schemas.ts
import { Type } from '@sinclair/typebox'

export const ErrorDetailSchema = Type.Object({
  path: Type.Optional(Type.String()),
  field: Type.Optional(Type.String()),
  message: Type.Optional(Type.String()),
})

export const ErrorResponseSchema = Type.Object({
  error: Type.Object({
    code: Type.Union([
      Type.Literal('INVALID_CREDENTIALS'),
      Type.Literal('EMAIL_ALREADY_EXISTS'),
      Type.Literal('TOKEN_EXPIRED'),
      Type.Literal('TOKEN_INVALID'),
      Type.Literal('UNAUTHORIZED'),
      Type.Literal('FORBIDDEN'),
      Type.Literal('VALIDATION_ERROR'),
      Type.Literal('REQUIRED_FIELD_MISSING'),
      Type.Literal('INVALID_FORMAT'),
      Type.Literal('VALUE_OUT_OF_RANGE'),
      Type.Literal('INVALID_TYPE'),
      Type.Literal('RESOURCE_NOT_FOUND'),
      Type.Literal('RESOURCE_CONFLICT'),
      Type.Literal('RESOURCE_LOCKED'),
      Type.Literal('RESOURCE_EXPIRED'),
      Type.Literal('INVALID_FILE_FORMAT'),
      Type.Literal('FILE_TOO_LARGE'),
      Type.Literal('FILE_CORRUPTED'),
      Type.Literal('UPLOAD_FAILED'),
      Type.Literal('OPERATION_NOT_ALLOWED'),
      Type.Literal('INSUFFICIENT_RESOURCES'),
      Type.Literal('DEPENDENCY_CONFLICT'),
      Type.Literal('BUSINESS_RULE_VIOLATION'),
      Type.Literal('DATABASE_ERROR'),
      Type.Literal('CASCADE_DELETE_ERROR'),
      Type.Literal('INTERNAL_SERVER_ERROR'),
      Type.Literal('SERVICE_UNAVAILABLE'),
      Type.Literal('EXTERNAL_SERVICE_ERROR'),
      Type.Literal('RATE_LIMIT_EXCEEDED'),
      Type.Literal('QUOTA_EXCEEDED'),
      Type.Literal('CONCURRENT_LIMIT_EXCEEDED'),
    ]),
    message: Type.String(),
    status: Type.Integer(),
    details: Type.Optional(Type.Array(ErrorDetailSchema)),
    method: Type.Optional(Type.String()),
    path: Type.Optional(Type.String()),
  }),
  requestId: Type.Optional(Type.String()),
  timestamp: Type.Optional(Type.String({ format: 'date-time' })),
})
```

## Usage

```typescript
// Business logic
if (!character) throw err('RESOURCE_NOT_FOUND', 'Character not found')

// Authorization
if (character.userId !== request.user.id) {
  throw err('FORBIDDEN', 'You can only access your own characters')
}

// Database operations (auto-normalized)
await prisma.user.create({ data: { email } }) // P2002 → EMAIL_ALREADY_EXISTS

// Route schemas
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

## Server Setup

```typescript
// src/server.ts
import { errorPlugin } from './plugins/error-handler'

const fastify = Fastify({ logger: true })

// Register error plugin FIRST
await fastify.register(errorPlugin)

// Then other plugins...
```
