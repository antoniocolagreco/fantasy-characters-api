# AI Response Patterns

Essential response formats for consistent API development.

## Core Response Structure

**Success (200/201):**

```json
{
  "data": {},
  "requestId": "string",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

**List with Pagination (200):**

```json
{
  "data": [],
  "pagination": {
    "limit": 20,
    "hasNext": true,
    "hasPrev": false,
    "startCursor": "abc123",
    "endCursor": "xyz987"
  },
  "requestId": "string",
  "timestamp": "string"
}
```

**Error (4xx/5xx):**

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "status": 400,
    "details": [{ "path": "string", "message": "string" }],
    "method": "string",
    "path": "string"
  },
  "requestId": "string",
  "timestamp": "string"
}
```

_See [error-handling.md](./error-handling.md) for complete error implementation
patterns._

## Required Implementation

### Helper Functions

```typescript
// src/shared/utils/response.helper.ts
export function success<T>(data: T, requestId?: string) {
  return {
    data,
    requestId,
    timestamp: new Date().toISOString(),
  }
}

export function created<T>(data: T, location: string, requestId?: string) {
  return {
    response: {
      data,
      requestId,
      timestamp: new Date().toISOString(),
    },
    headers: { Location: location },
  }
}

export function paginated<T>(
  items: T[],
  pagination: {
    limit: number
    hasNext: boolean
    hasPrev: boolean
    startCursor?: string
    endCursor?: string
  },
  requestId?: string
) {
  return {
    data: items,
    pagination,
    requestId,
    timestamp: new Date().toISOString(),
  }
}

```typescript
// src/shared/schemas/response.schema.ts (centralized exports)
export const BaseResponseSchema = Type.Object({
  requestId: Type.Optional(Type.String()),
  timestamp: Type.Optional(Type.String({ format: 'date-time' })),
}, { $id: 'BaseResponse' })

export const PaginationSchema = Type.Object({
  limit: Type.Number({ minimum: 1, maximum: 100 }),
  hasNext: Type.Boolean(),
  hasPrev: Type.Boolean(),
  startCursor: Type.Optional(Type.String()),
  endCursor: Type.Optional(Type.String()),
}, { $id: 'Pagination' })

export function createSuccessResponseSchema<T>(dataSchema: T) {
  return Type.Intersect([
    BaseResponseSchema,
    Type.Object({ data: dataSchema }),
  ])
}

export function createPaginatedResponseSchema<T>(itemSchema: T) {
  return Type.Intersect([
    BaseResponseSchema,
    Type.Object({
      data: Type.Array(itemSchema),
      pagination: PaginationSchema,
    }),
  ])
}
```

### HTTP Status Constants

```typescript
// src/common/constants/http-status.ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS]
```

### TypeBox Schema Builder

```typescript
// Import from centralized schema exports
import { 
  BaseResponseSchema, 
  PaginationSchema,
  createSuccessResponseSchema,
  createPaginatedResponseSchema 
} from '../shared/schemas'
```

## Usage Patterns

### Controller Implementation

```typescript
import { HTTP_STATUS } from '../../common/constants/http-status'

// Always use helpers for consistent format
export async function getCharacter(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const character = await characterService.getById(request.params.id)
  return reply.code(HTTP_STATUS.OK).send(success(character, request.id))
}

export async function createCharacter(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const character = await characterService.create(request.body)
  const { response, headers } = created(
    character,
    `/api/v1/characters/${character.id}`,
    request.id
  )
  return reply.code(HTTP_STATUS.CREATED).headers(headers).send(response)
}

export async function listCharacters(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { items, pagination } = await characterService.list(request.query)
  return reply
    .code(HTTP_STATUS.OK)
    .send(paginated(items, pagination, request.id))
}
```

### Route Schema Definition

```typescript
// Define response schemas for all routes
app.get(
  '/characters/:id',
  {
    schema: {
      response: {
        200: createSuccessResponseSchema(CharacterSchema),
        404: { $ref: 'ErrorResponse#' }, // See error-handling.md for ErrorResponseSchema
        500: { $ref: 'ErrorResponse#' },
      },
    },
  },
  getCharacterHandler
)

app.post(
  '/characters',
  {
    schema: {
      body: CreateCharacterSchema,
      response: {
        201: createSuccessResponseSchema(CharacterSchema),
        400: { $ref: 'ErrorResponse#' },
        409: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
  },
  createCharacterHandler
)

app.get(
  '/characters',
  {
    schema: {
      response: {
        200: createPaginatedResponseSchema(CharacterSchema),
        400: { $ref: 'ErrorResponse#' },
        500: { $ref: 'ErrorResponse#' },
      },
    },
  },
  listCharactersHandler
)
```

## HTTP Status Codes

- **200 OK**: GET (single/list), PUT, PATCH
- **201 Created**: POST (set `Location` header)
- **204 No Content**: DELETE (no response body)
- **4xx/5xx**: Use error envelope (see [error-handling.md](./error-handling.md))

## Response Compression

**Automatic compression** is handled transparently by `@fastify/compress`
plugin:

- **JSON/Text responses** are automatically compressed (Brotli or gzip) based on
  client's `Accept-Encoding` header
- **Binary responses** (images, files) are excluded from compression to avoid
  overhead
- **Headers added automatically**: `Content-Encoding`, `Vary: Accept-Encoding`
- **Threshold**: Only responses > 1KB are compressed to skip tiny payloads

```typescript
// Plugin configuration (register early in app setup)
await app.register(compress, {
  global: true,
  threshold: 1024, // Skip responses smaller than 1KB
  customTypes: /^(text\/.*|application\/json|application\/.*\+json)$/i,
})
```

**Client negotiation examples:**

- `Accept-Encoding: br` → `Content-Encoding: br` (Brotli)
- `Accept-Encoding: gzip` → `Content-Encoding: gzip`
- `Accept-Encoding: identity` → No compression
- Image endpoints → Always uncompressed regardless of Accept-Encoding

**Your response helpers work unchanged** - compression happens automatically
after your controller returns the response envelope.

## Critical Rules

1. **Always** include `requestId` and `timestamp`
2. **Always** use `data` wrapper for success responses
3. **Always** use cursor-based pagination for lists
4. **Never** return raw objects - always use envelope
5. **Always** use `HTTP_STATUS` constants instead of magic numbers
6. **Always** use `$ref: 'ErrorResponse#'` for error responses
7. **Always** use `created()` helper for 201 responses with Location header
8. **Always** register compression plugin before routes for automatic JSON/text
   compression
9. **Always** use consistent pagination with `hasNext`, `hasPrev`, `startCursor`, `endCursor`
