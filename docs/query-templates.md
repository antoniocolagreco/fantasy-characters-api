# API Query Templates (Requests)

This document contains some request payload templates and their TypeBox schemas for copy/paste.

---

## General guidance for query schemas (lists)

All list endpoints share the same pagination, with optional filtering and sorting. Keep it consistent so clients can reuse components.

Conventions

- Pagination: cursor-based
  - limit: 1..100 (default 20)
  - cursor: opaque string (base64 JSON like { lastId, lastSort }, but treat as opaque in clients)
- Sorting: prefer stable, indexed fields with a tie‑breaker
  - Example default: createdAt DESC, id DESC
  - Expose a small, controlled set of sort keys where needed (e.g., name, level)
- Filtering: put common filters first in DB indexes (ownerId, visibility, taxonomy ids)
  - Keep filter types simple (exact matches, small enums, ranges)
- Validation: always bound numbers and lengths; whitelist sort keys and directions

Reusable TypeBox schemas

```ts
import { Type } from '@sinclair/typebox';

// Base list query shared by all endpoints
export const PaginationQuery = Type.Object({
 limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
 cursor: Type.Optional(Type.String())
});

// Optional common filters used across resources
export const VisibilityQuery = Type.Object({
 visibility: Type.Optional(Type.Union([
  Type.Literal('PUBLIC'),
  Type.Literal('PRIVATE'),
  Type.Literal('HIDDEN')
 ]))
});

export const OwnerQuery = Type.Object({
 ownerId: Type.Optional(Type.String()) // UUIDv7
});

// Typical sorting pattern: expose a small whitelist
export const SortQuery = Type.Object({
 sortBy: Type.Optional(Type.Union([
  Type.Literal('createdAt'),
  Type.Literal('name'),
  Type.Literal('level')
 ])),
 sortDir: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')]))
});

// Compose per-resource
export const CharactersListQuery = Type.Intersect([
 PaginationQuery,
 VisibilityQuery,
 OwnerQuery,
 SortQuery,
 Type.Object({
  raceId: Type.Optional(Type.String()),
  archetypeId: Type.Optional(Type.String()),
  minLevel: Type.Optional(Type.Integer({ minimum: 1 })),
  maxLevel: Type.Optional(Type.Integer({ minimum: 1 }))
 })
]);
```

Implementation notes (handler/service)

- Set defaults in the handler: limit=20; sortBy=createdAt; sortDir=desc
- Validate business rules: minLevel <= maxLevel when both present
- Decode cursor server-side (try/catch); on invalid cursor, return 400
- Build DB query with filters → orderBy [sortBy, id] with dir; apply pagination cursor
- Return pagination.cursor.next when there are more records; prev optional

Example (Fastify route snippet)

```ts
import { CharactersListQuery } from './schemas';

app.get('/api/characters', {
 schema: {
  querystring: CharactersListQuery,
  response: { 200: CharactersListResponse }
 }
}, async (req, reply) => {
 const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', ...filters } = req.query as any;
 // validate cross-field constraints here
 const page = await charactersService.list({ limit, cursor, sortBy, sortDir, filters });
 return reply.code(200).send(success(page.items, { pagination: page.pagination, requestId: req.id }));
});
```

Edge cases to handle

- Empty results with cursor provided → return empty array with pagination and no next
- Very large limit → cap at 100 regardless of input
- Invalid cursor → 400 with validation error details
- Unauthorized filters (e.g., visibility=PRIVATE for non-owners) → ignore or 403, per endpoint policy

## Ban/Unban user

Request JSON body:

```json
{
 "isBanned": true,
 "banReason": "Abusive behavior",
 "bannedUntil": "2025-12-31T23:59:59Z"
}
```

Rules

- isBanned: boolean; if false, server clears banReason and bannedUntil
- banReason: optional string; enforce max length (for example, 500 chars)
- bannedUntil: optional ISO 8601 timestamp; must be in the future when isBanned=true
- Server should set `bannedById = req.user.id` on ban
- RBAC: Moderators may ban/unban only USER targets; Admins may ban/unban USER and MODERATOR; neither can act on ADMIN accounts

TypeBox schema (Fastify):

```ts
import { Type } from '@sinclair/typebox';

export const BanRequestBody = Type.Object({
 isBanned: Type.Boolean(),
 banReason: Type.Optional(Type.String({ maxLength: 500 })),
 bannedUntil: Type.Optional(Type.String({ format: 'date-time' }))
});

// Optional: custom refinement in preValidation to ensure bannedUntil is in the future when isBanned=true
```
