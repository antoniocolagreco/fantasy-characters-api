# Centralized Error Handling (Fastify + TypeScript)

This spec defines a single, predictable error format across the API and shows how to implement it.

## Objectives

- Single JSON shape for all failures
- Stable error codes for clients (no coupling to internal exceptions)
- Correct HTTP status mapping and retry semantics
- Minimal, safe details in responses; full context in logs
- Works with validation (Ajv), DB (Prisma), auth (JWT), files (multipart/Sharp), rate limit, and 404

---

## Error response contract

- Content type: `application/json`
- Top-level envelope: `error`

Shape:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "status": 400,
    "details": [
      { "path": "string", "message": "string" }
    ],
    "requestId": "string",
    "timestamp": "string",
    "method": "string",
    "path": "string"
  }
}
```

```json
{
 "error": {
  "code": "RESOURCE_NOT_FOUND",
  "message": "Character not found",
  "status": 404,
  "details": [
   { "path": "/params/id", "message": "must be integer" }
  ],
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z",
  "method": "GET",
  "path": "/v1/characters/123"
 }
}
```

Notes:

- `details` is optional; use for validation fields or small hints (never secrets or stack traces).
- `message` is human-readable English, safe to display; do not leak internals.
- Include `requestId` (Fastify provides `request.id`).

---

## Error codes (enum) and mapping

All codes below are supported. Unless stated, they default to the listed HTTP status.

| Code                     | HTTP | Retry?          | Log level |
|--------------------------|-----:|:---------------:|-----------|
| INVALID_CREDENTIALS      |  401 | no              | warn      |
| EMAIL_ALREADY_EXISTS     |  409 | no              | info      |
| TOKEN_EXPIRED            |  401 | yes (re-auth)   | info      |
| TOKEN_INVALID            |  401 | no              | warn      |
| UNAUTHORIZED             |  401 | no              | warn      |
| FORBIDDEN                |  403 | no              | warn      |
| VALIDATION_ERROR         |  400 | no              | info      |
| REQUIRED_FIELD_MISSING   |  400 | no              | info      |
| INVALID_FORMAT           |  400 | no              | info      |
| VALUE_OUT_OF_RANGE       |  400 | no              | info      |
| INVALID_TYPE             |  400 | no              | info      |
| RESOURCE_NOT_FOUND       |  404 | no              | info      |
| RESOURCE_CONFLICT        |  409 | no              | info      |
| RESOURCE_LOCKED          |  423 | yes (later)     | warn      |
| RESOURCE_EXPIRED         |  410 | no              | info      |
| INVALID_FILE_FORMAT      |  400 | no              | info      |
| FILE_TOO_LARGE           |  413 | no              | info      |
| FILE_CORRUPTED           |  400 | no              | info      |
| UPLOAD_FAILED            |  500 | yes             | error     |
| OPERATION_NOT_ALLOWED    |  400 | no              | warn      |
| INSUFFICIENT_RESOURCES   |  400 | maybe           | warn      |
| DEPENDENCY_CONFLICT      |  409 | no              | info      |
| BUSINESS_RULE_VIOLATION  |  422 | no              | info      |
| DATABASE_ERROR           |  500 | yes             | error     |
| CASCADE_DELETE_ERROR     |  409 | no              | warn      |
| INTERNAL_SERVER_ERROR    |  500 | maybe           | error     |
| SERVICE_UNAVAILABLE      |  503 | yes             | error     |
| EXTERNAL_SERVICE_ERROR   |  502 | yes             | error     |
| RATE_LIMIT_EXCEEDED      |  429 | yes (backoff)   | warn      |
| QUOTA_EXCEEDED           |  429 | no (until reset)| info      |
| CONCURRENT_LIMIT_EXCEEDED|  429 | yes (later)     | warn      |

TypeScript union (for shared types):

```ts
export type ErrorCode =
 | 'INVALID_CREDENTIALS'
 | 'EMAIL_ALREADY_EXISTS'
 | 'TOKEN_EXPIRED'
 | 'TOKEN_INVALID'
 | 'UNAUTHORIZED'
 | 'FORBIDDEN'
 | 'VALIDATION_ERROR'
 | 'REQUIRED_FIELD_MISSING'
 | 'INVALID_FORMAT'
 | 'VALUE_OUT_OF_RANGE'
 | 'INVALID_TYPE'
 | 'RESOURCE_NOT_FOUND'
 | 'RESOURCE_CONFLICT'
 | 'RESOURCE_LOCKED'
 | 'RESOURCE_EXPIRED'
 | 'INVALID_FILE_FORMAT'
 | 'FILE_TOO_LARGE'
 | 'FILE_CORRUPTED'
 | 'UPLOAD_FAILED'
 | 'OPERATION_NOT_ALLOWED'
 | 'INSUFFICIENT_RESOURCES'
 | 'DEPENDENCY_CONFLICT'
 | 'BUSINESS_RULE_VIOLATION'
 | 'DATABASE_ERROR'
 | 'CASCADE_DELETE_ERROR'
 | 'INTERNAL_SERVER_ERROR'
 | 'SERVICE_UNAVAILABLE'
 | 'EXTERNAL_SERVICE_ERROR'
 | 'RATE_LIMIT_EXCEEDED'
 | 'QUOTA_EXCEEDED'
 | 'CONCURRENT_LIMIT_EXCEEDED';
```

---

## Implementation (Fastify plugin)

Create a small error helper and a global error handler. Keep it dependency-light.

```ts
// src/errors/app-error.ts
import { FastifyError, FastifyInstance, FastifyPluginAsync } from 'fastify';

export type ErrorCode = /* union from table above */ any;

export interface ErrorDetail {
 path?: string;
 field?: string;
 message?: string;
 [k: string]: unknown;
}

export class AppError extends Error {
 readonly code: ErrorCode;
 readonly status: number;
 readonly details?: ErrorDetail[];
 constructor(code: ErrorCode, message: string, status: number, details?: ErrorDetail[]) {
  super(message);
  this.code = code;
  this.status = status;
  this.details = details;
 }
}

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
};

export function err(code: ErrorCode, message?: string, details?: ErrorDetail[], status?: number) {
 return new AppError(code, message ?? code, status ?? DEFAULT_STATUS[code], details);
}

function toPayload(code: ErrorCode, message: string, status: number, req: any, details?: ErrorDetail[]) {
 return {
  error: {
   code,
   message,
   status,
   details,
   requestId: req?.id,
   timestamp: new Date().toISOString(),
   method: req?.method,
   path: req?.url,
  },
 };
}

// Map framework/library errors → AppError
function normalizeUnknown(e: unknown): AppError | null {
 // Prisma
 if ((e as any)?.code?.startsWith?.('P')) {
  const pe = e as any; // PrismaClientKnownRequestError
  if (pe.code === 'P2002') return err('RESOURCE_CONFLICT', 'Unique constraint conflict');
  if (pe.code === 'P2014') return err('CASCADE_DELETE_ERROR', 'Cannot delete due to dependencies');
  return err('DATABASE_ERROR', 'Database operation failed');
 }
 // JWT (jsonwebtoken)
 if ((e as any)?.name === 'TokenExpiredError') return err('TOKEN_EXPIRED', 'Token has expired');
 if ((e as any)?.name === 'JsonWebTokenError') return err('TOKEN_INVALID', 'Invalid token');
 // Fastify validation (Ajv)
 if ((e as any)?.validation) {
  const ve = e as FastifyError & { validation: any[] };
  const details = (ve.validation || []).map((v: any) => ({ path: v.instancePath || v.dataPath, message: v.message }));
  return err('VALIDATION_ERROR', 'Request validation failed', details);
 }
 // Rate limit
 if ((e as any)?.statusCode === 429) return err('RATE_LIMIT_EXCEEDED', 'Too many requests');
 return null;
}

export const errorPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
 // 404 → RESOURCE_NOT_FOUND
 fastify.setNotFoundHandler((req, reply) => {
  const e = err('RESOURCE_NOT_FOUND', 'Resource not found');
  const payload = toPayload(e.code, e.message, e.status, req);
  req.log.info({ code: e.code }, 'not found');
  reply.code(e.status).send(payload);
 });

 fastify.setErrorHandler((e, req, reply) => {
  let appErr = e instanceof AppError ? e : normalizeUnknown(e) ?? err('INTERNAL_SERVER_ERROR', 'Unexpected error');

  // Log: 5xx as error, 4xx as info/warn depending on code
  const logFn = appErr.status >= 500 ? req.log.error : /UNAUTHORIZED|FORBIDDEN|INVALID_CREDENTIALS/.test(appErr.code) ? req.log.warn : req.log.info;
  logFn({ err: e, code: appErr.code, status: appErr.status }, 'request failed');

  const payload = toPayload(appErr.code, appErr.message, appErr.status, req, appErr.details);
  reply.code(appErr.status).type('application/json').send(payload);
 });
};
```

Register it once during server bootstrap:

```ts
// src/server.ts
import Fastify from 'fastify';
import { errorPlugin } from './errors/app-error';

export async function buildServer() {
 const app = Fastify({ logger: true });
 await app.register(errorPlugin);
 return app;
}
```

---

## Validation (TypeBox/Ajv)

Fastify already throws on schema violations; the plugin maps those to `VALIDATION_ERROR` with `details` from Ajv.

Example route with schemas and documented error responses:

```ts
// src/routes/characters.ts
import { Type } from '@sinclair/typebox';

const Params = Type.Object({ id: Type.Integer({ minimum: 1 }) });
const Character = Type.Object({ id: Type.Integer(), name: Type.String() });
const ErrorEnvelope = Type.Object({
 error: Type.Object({
  code: Type.String(),
  message: Type.String(),
  status: Type.Integer(),
  details: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Any()))),
  requestId: Type.Optional(Type.String()),
  timestamp: Type.Optional(Type.String()),
  method: Type.Optional(Type.String()),
  path: Type.Optional(Type.String()),
 }),
});

export default async function routes(app: any) {
 app.get('/v1/characters/:id', {
  schema: {
   params: Params,
   response: {
    200: Character,
    400: ErrorEnvelope,
    401: ErrorEnvelope,
    403: ErrorEnvelope,
    404: ErrorEnvelope,
    409: ErrorEnvelope,
    422: ErrorEnvelope,
    429: ErrorEnvelope,
    500: ErrorEnvelope,
   },
  },
 }, async (req, reply) => {
  const { id } = req.params as any;
  const character = await app.prisma.character.findUnique({ where: { id } });
  if (!character) throw err('RESOURCE_NOT_FOUND', 'Character not found');
  return character;
 });
}
```

---

## Database (Prisma) mapping

Map common Prisma errors:

- `P2002` unique constraint → `RESOURCE_CONFLICT` (or `EMAIL_ALREADY_EXISTS` when the field is `email`)
- `P2014` relation violation on delete → `CASCADE_DELETE_ERROR`
- Any other known/unknown → `DATABASE_ERROR`

Snippet when creating a user:

```ts
try {
 await prisma.user.create({ data: { email, passwordHash } });
} catch (e: any) {
 if (e?.code === 'P2002' && e?.meta?.target?.includes('email')) {
  throw err('EMAIL_ALREADY_EXISTS', 'Email already registered');
 }
 throw e; // plugin will normalize
}
```

---

## Authentication (JWT) mapping

Normalize token errors in an auth hook:

```ts
import jwt from 'jsonwebtoken';

async function authHook(req: any) {
 const hdr = req.headers.authorization;
 if (!hdr?.startsWith('Bearer ')) throw err('UNAUTHORIZED', 'Missing bearer token');
 const token = hdr.slice(7);
 try {
  req.user = jwt.verify(token, process.env.JWT_SECRET!);
 } catch (e: any) {
  if (e?.name === 'TokenExpiredError') throw err('TOKEN_EXPIRED', 'Token expired');
  throw err('TOKEN_INVALID', 'Invalid token');
 }
}
```

Example login failure:

```ts
throw err('INVALID_CREDENTIALS', 'Invalid email or password');
```

---

## File uploads (multipart) and Sharp

Recommended limits and mapping:

- `file.size > limit` → `FILE_TOO_LARGE`
- Unsupported mime/extension → `INVALID_FILE_FORMAT`
- Decoding failure in Sharp → `FILE_CORRUPTED` or `INVALID_FILE_FORMAT`
- Unexpected processing issues → `UPLOAD_FAILED`

Example:

```ts
import sharp from 'sharp';

app.post('/v1/media', { preHandler: app.multipart }, async (req, reply) => {
 const parts = req.parts();
 for await (const part of parts) {
  if (part.type !== 'file') continue;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(part.mimetype)) {
   throw err('INVALID_FILE_FORMAT', 'Only JPEG/PNG/WebP allowed');
  }
  if (part.file.truncated) throw err('FILE_TOO_LARGE', 'File too large');
  try {
   const buf = await part.toBuffer();
   const webp = await sharp(buf).webp({ quality: 80 }).toBuffer();
   // store webp
  } catch {
   throw err('UPLOAD_FAILED', 'Unable to process image');
  }
 }
 return { ok: true };
});
```

---

## Rate limit & quotas

`@fastify/rate-limit` replies with 429. The plugin maps it to `RATE_LIMIT_EXCEEDED`. For business quotas (per user/plan), throw `QUOTA_EXCEEDED` from your logic.

---

## Swagger/OpenAPI integration

Register a shared error schema and reuse in route responses.

```ts
// during bootstrap
app.addSchema({
 $id: 'ErrorEnvelope',
 type: 'object',
 properties: {
  error: {
   type: 'object',
   properties: {
    code: { type: 'string', enum: [
     'INVALID_CREDENTIALS','EMAIL_ALREADY_EXISTS','TOKEN_EXPIRED','TOKEN_INVALID','UNAUTHORIZED','FORBIDDEN','VALIDATION_ERROR','REQUIRED_FIELD_MISSING','INVALID_FORMAT','VALUE_OUT_OF_RANGE','INVALID_TYPE','RESOURCE_NOT_FOUND','RESOURCE_CONFLICT','RESOURCE_LOCKED','RESOURCE_EXPIRED','INVALID_FILE_FORMAT','FILE_TOO_LARGE','FILE_CORRUPTED','UPLOAD_FAILED','OPERATION_NOT_ALLOWED','INSUFFICIENT_RESOURCES','DEPENDENCY_CONFLICT','BUSINESS_RULE_VIOLATION','DATABASE_ERROR','CASCADE_DELETE_ERROR','INTERNAL_SERVER_ERROR','SERVICE_UNAVAILABLE','EXTERNAL_SERVICE_ERROR','RATE_LIMIT_EXCEEDED','QUOTA_EXCEEDED','CONCURRENT_LIMIT_EXCEEDED'
    ] },
    message: { type: 'string' },
    status: { type: 'integer' },
    details: { type: 'array', items: { type: 'object', additionalProperties: true } },
    requestId: { type: 'string' },
    timestamp: { type: 'string' },
    method: { type: 'string' },
    path: { type: 'string' }
   },
   required: ['code','message','status']
  }
 },
 required: ['error']
});

// in route schemas
schema: { response: { 400: { $ref: 'ErrorEnvelope#' }, 401: { $ref: 'ErrorEnvelope#' }, /* ... */ } }
```

Example OpenAPI example block for 404:

```json
{
 "error": {
  "code": "RESOURCE_NOT_FOUND",
  "message": "Character not found",
  "status": 404,
  "requestId": "01HZZ...",
  "timestamp": "2025-08-30T10:35:12.345Z"
 }
}
```

---

## Logging (Pino) policy

- 5xx and integration failures → `error`
- Auth/permission denials → `warn`
- Client mistakes (validation, not found) → `info`
- Never log secrets or tokens. If needed, log token hash or last 6 chars.
- Use `requestId` for correlation (Fastify logger includes it).

---

## Usage examples

Throw business error:

```ts
if (!canDelete(entity)) throw err('OPERATION_NOT_ALLOWED', 'Cannot delete in the current state');
```

Enforce concurrency limit:

```ts
if (currentOps >= limit) throw err('CONCURRENT_LIMIT_EXCEEDED', 'Too many concurrent operations');
```

External service failure:

```ts
try {
 await callGateway();
} catch {
 throw err('EXTERNAL_SERVICE_ERROR', 'Upstream gateway failed');
}
```

---

## Testing notes (Vitest)

- Unit-test `normalizeUnknown` with samples: Ajv errors, Prisma P2002, JWT expired, generic Error → INTERNAL_SERVER_ERROR
- E2E happy path: route returns 200; not found returns `RESOURCE_NOT_FOUND`
- E2E validation: invalid params → `VALIDATION_ERROR` with details array

---

## Adding a new error code

1) Add the string to the `ErrorCode` union
2) Add default status to `DEFAULT_STATUS`
3) Optionally extend `normalizeUnknown`
4) Add to Swagger `enum`
5) Use `throw err('NEW_CODE', 'Message')` where needed

---

## Non-goals

- No stack traces in API responses (log only)
- No i18n in backend for now; messages are English
- No external error tracker required to use this (can be added later)
