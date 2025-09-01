# API Response Templates (Success Envelopes)

This spec defines consistent success response shapes for the API. It complements the error envelope defined in `docs/error-handling.md`.

## Goals

- Predictable envelopes across endpoints
- Clear pagination and linking
- Minimal, safe metadata (requestId, timestamp)
- Easy to type (TypeScript) and document (Swagger)

---

## Envelope contract

- Content type: `application/json`
- Success responses always use `data` at top level
- Error responses always use `error` at top level (see error-handling.md for complete specification)
- Both success and error responses include `requestId` and `timestamp` for correlation
- `pagination` field is included only for list/collection endpoints with cursor-based pagination
- Single resource endpoints omit the `pagination` field

Shape (generic):

```json
{
  "data": {},
  "requestId": "string",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

Common success envelope (use `pagination` when listing; omit it for single resources):

```json
{
  "data": [{}, {}, {}],
  "pagination": { "limit": 20, "cursor": { "next": "abc123", "prev": "xyz987" } },
  "requestId": "string",
  "timestamp": "string"
}
```

---

## Standard templates

### 1) Single resource (GET)

- 200 OK
- `data` is the resource object

Example:

```json
{
  "data": { "id": 1, "name": "Aria Lightblade" },
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

### 2) Collection (GET) with cursor-based pagination

- 200 OK
- `data` is an array
- `pagination` contains cursor info

```json
{
  "data": [ { "id": 1 }, { "id": 2 } ],
  "pagination": { "limit": 20, "cursor": { "next": "abc123", "prev": "xyz987" } },
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

### 3) Create (POST)

- 201 Created
- `Location` header → `/v1/characters/{id}`
- Body includes created resource or a minimal payload

Example (full):

```json
{
  "data": { "id": 101, "name": "Nova Stormsong" },
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

### 4) Update (PATCH/PUT)

- 200 OK with updated resource, or 204 No Content
- Prefer 200 when clients need the new state

Example:

```json
{
  "data": { "id": 101, "name": "Nova Stormsong", "title": "Archmage" },
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

### 5) Delete (DELETE)

- 204 No Content (no body) or 200 OK with confirmation
- Prefer 200 when you need to return `requestId`/`timestamp` for tracking

Example (200):

```json
{
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

### 6) Error Response Example

Error responses use a different envelope structure. See `docs/error-handling.md` for complete error specification.

Basic error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "path": "/body/name",
        "message": "Name is required and must be at least 2 characters"
      }
    ]
  },
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

### 7) Bulk operations

- 200 OK when processed synchronously
- Returns `summary` and `results` at top level (different from normal `data` envelope)

Example:

```json
{
  "summary": { "successCount": 2, "failCount": 1 },
  "results": [
    { "ok": true,  "index": 0, "value": { "id": 101 } },
    { "ok": false, "index": 1, "error": { "code": "VALIDATION_ERROR", "message": "Invalid name", "details": [{ "path": "/body/name", "message": "too short" }] } },
    { "ok": true,  "index": 2, "value": { "id": 103 } }
  ],
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

### 8) Accepted/async processing

- 202 Accepted for long-running tasks
- Body returns an operation resource clients can poll

Example:

```json
{
  "data": {
    "operationId": "op_01J...",
    "status": "pending"
  },
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
}
```

---

## TypeScript helpers (runtime building blocks)

These are small helpers you can copy into `src/http/response.ts` (or similar). They use generics and can inject `requestId`/`timestamp`.

```ts
// src/http/response.ts
export type BaseEnvelope = { requestId?: string; timestamp?: string };

export type Pagination = { limit?: number; cursor?: { next?: string; prev?: string } } | undefined;

// Common success envelope types (use across the app)
export type SuccessEnvelope<T> = {
  data: T;
} & BaseEnvelope;

export type PaginatedSuccessEnvelope<T> = {
  data: T[];
  pagination: Pagination; // usually present for list endpoints
} & BaseEnvelope;

// Pagination query type to reuse in route handlers
export type PaginationQuery = {
  limit?: number; // default/maximum enforced server-side
  cursor?: string;
};

export function success<T>(data: T, opts?: { pagination?: Pagination; requestId?: string; ts?: Date }) {
  const now = (opts?.ts ?? new Date()).toISOString();
  return {
    data,
    ...(opts?.pagination ? { pagination: opts.pagination } : {}),
    requestId: opts?.requestId,
    timestamp: now,
  };
}

export function paginated<T>(items: T[], pagination: Pagination, opts?: { requestId?: string; ts?: Date }) {
  return success(items, { pagination, requestId: opts?.requestId, ts: opts?.ts });
}

export function accepted(op: { operationId: string; status: 'pending' | 'running' | 'completed' | 'failed' }, opts?: { requestId?: string; ts?: Date }) {
  return success(op, { requestId: opts?.requestId, ts: opts?.ts });
}
```

Usage inside a route (example):

```ts
const payload = success(character, { requestId: request.id });
reply.code(200).send(payload);
```

---

## Base schemas (TypeBox) — copy/paste

Register reusable schemas once and reference them in route `response` sections. Adjust to your needs.

```ts
// during bootstrap
import { Type, TSchema } from '@sinclair/typebox';

// Shared pagination schemas
export const PaginationQuery = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  cursor: Type.Optional(Type.String())
});

export const PaginationResponse = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1 })),
  cursor: Type.Optional(Type.Object({ next: Type.Optional(Type.String()), prev: Type.Optional(Type.String()) }))
});

// Base success envelope — compose with your route's data schema
// Example usage below shows how to embed your own data shape.
export const SuccessBase = Type.Object({
  requestId: Type.Optional(Type.String()),
  timestamp: Type.Optional(Type.String())
});

// Envelope builder — reuse for any data schema
export function envelopeOf(dataSchema: TSchema, paginated = false) {
  const core = paginated
    ? Type.Object({ data: Type.Array(dataSchema), pagination: PaginationResponse })
    : Type.Object({ data: dataSchema, pagination: Type.Optional(PaginationResponse) });
  return Type.Intersect([core, SuccessBase]);
}

// Example: single Character and list responses
const Character = Type.Object({ id: Type.Integer(), name: Type.String() });
export const CharacterResponse = envelopeOf(Character);
export const CharactersListResponse = envelopeOf(Character, true);

// Bulk response (no top-level data; outcomes under result)
export const BulkEntry = Type.Union([
  Type.Object({ ok: Type.Literal(true), index: Type.Integer(), value: Character }),
  Type.Object({ ok: Type.Literal(false), index: Type.Integer(), error: Type.Object({ code: Type.String(), message: Type.String() }) })
]);

export const BulkResponse = Type.Intersect([
  Type.Object({
    summary: Type.Object({ successCount: Type.Integer(), failCount: Type.Integer() }),
    results: Type.Array(BulkEntry)
  }),
  SuccessBase
]);
```

Then in a route schema (Fastify JSON schema):

```ts
schema: {
  response: {
    200: CharactersListResponse,
    400: { $ref: 'ErrorEnvelope#' },
    500: { $ref: 'ErrorEnvelope#' }
  }
}
```

---

## Headers and conventions

- `Location`: set on 201 Created with the new resource URL
- Pagination headers (optional): use `Link` header for navigation (e.g., rel="next"; rel="prev"). Do not include URLs in the JSON body.
- Correlation: include Fastify `request.id` in the body and logs
- Timestamps: ISO-8601 in UTC

---

## Minimal examples (copy/paste)

### Success Responses

- Single resource: `{ "data": { "id": 1 }, "requestId": "...", "timestamp": "..." }`
- List (cursor): `{ "data": [ {"id":1} ], "pagination": { "limit": 10, "cursor": { "next": "abc123" } }, "requestId": "...", "timestamp": "..." }`
- Created: status 201 + `Location` + `{ "data": { "id": 42 }, "requestId": "...", "timestamp": "..." }`
- Deleted: status 200 + `{ "requestId": "...", "timestamp": "..." }` or 204 (no body)
- Accepted: status 202 + `{ "data": { "operationId": "op_...", "status": "pending" }, "requestId": "...", "timestamp": "..." }`
- Bulk: `{ "summary": { "successCount": 1, "failCount": 1 }, "results": [...], "requestId": "...", "timestamp": "..." }`

### Error Responses

- Any error: `{ "error": { "code": "ERROR_CODE", "message": "Error message", "details": [] }, "requestId": "...", "timestamp": "..." }`

---

## Interop with error handling

- Success envelopes always use `data` at the top level (except bulk operations which use `summary`/`results`)
- Error responses always use `error` at the top level
- Never mix `data` and `error` in a single response
- Both envelope types include `requestId` and `timestamp` for tracing

---

## Testing notes (Vitest)

- Ensure list endpoints return arrays and correct `pagination` fields
- Verify `requestId`/`timestamp` presence in all responses
- For 201, assert `Location` header and body shape
- For bulk, assert `results` entries align with input order (check `index`)
- Test that error responses use `error` envelope structure
- Validate that success responses use `data` envelope structure
