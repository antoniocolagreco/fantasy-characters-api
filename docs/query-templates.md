# AI Query & Validation Essentials

Essential patterns for schema-first query handling and validation using TypeBox.

## Critical Rules

Fundamental principles that must be followed to maintain code quality and consistency.

1. **Always compose from base schemas** - `Type.Intersect([PaginationQuery, SortQuery, ...])`
2. **Always derive types** - `type Params = Static<typeof Schema>`
3. **Use query helpers** - `buildWhere()`, `applyCursor()`, `buildPagination()`
4. **Always sort with tie-breaker** - Use `buildOrderBy()` for automatic `id` tie-breaker
5. **Always validate business rules** - Check min/max relationships
6. **Always apply RBAC** - Filter by user permissions in service
7. **Never use `any` types** - Use Prisma generated types or proper unions
8. **Never use type assertions** - Use type guards and explicit field access

## Core Pattern

Schema-first approach eliminates type duplication and ensures runtime validation matches TypeScript types.

Define once with TypeBox → Derive TypeScript types → Use everywhere

```typescript
// 1. Define schema
export const CharactersListQuery = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  cursor: Type.Optional(Type.String()),
  visibility: Type.Optional(Type.Union([
    Type.Literal('PUBLIC'),
    Type.Literal('PRIVATE'),
    Type.Literal('HIDDEN'),
  ])),
  raceId: Type.Optional(Type.String({ format: 'uuid' })),
})

// 2. Derive types
export type CharactersListParams = Static<typeof CharactersListQuery>

// 3. Use in service
export async function listCharacters(params: CharactersListParams) {
  // Implementation
}
```

## Base Query Schemas

Reusable building blocks for consistent query parameters across all endpoints.

```typescript
// src/common/schemas/query.schemas.ts
export const PaginationQuery = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  cursor: Type.Optional(Type.String()),
})

export const VisibilityQuery = Type.Object({
  visibility: Type.Optional(Type.Union([
    Type.Literal('PUBLIC'),
    Type.Literal('PRIVATE'),
    Type.Literal('HIDDEN'),
  ])),
})

export const SortQuery = Type.Object({
  sortBy: Type.Optional(Type.Union([
    Type.Literal('createdAt'),
    Type.Literal('name'),
    Type.Literal('level'),
  ])),
  sortDir: Type.Optional(Type.Union([
    Type.Literal('asc'),
    Type.Literal('desc'),
  ])),
})

// Derive types
export type PaginationParams = Static<typeof PaginationQuery>
export type VisibilityFilter = Static<typeof VisibilityQuery>
export type SortParams = Static<typeof SortQuery>
```

## Route Implementation

Fastify route registration with automatic TypeBox validation and typed request objects. For consistent response formatting, see [response-templates.md](./response-templates.md).

```typescript
// Register route with schema validation
app.get('/characters', {
  schema: {
    tags: ['characters'],
    querystring: CharactersListQuery,
    response: { 200: CharactersListResponse },
  },
}, async (req, reply) => {
  const query = req.query // Automatically typed
  
  // Validate business rules with reusable helper
  validateRange(query.minLevel, query.maxLevel, 'minLevel', 'maxLevel')

  const result = await listCharacters({ ...query, userId: req.user?.id })
  return reply.send(success(result.items, { pagination: result.pagination }))
})
```

## Query Helpers (Minimal Boilerplate)

Generic utilities to transform query params into Prisma where conditions with zero repetitive code.

```typescript
// src/common/database/query-helpers.ts
export function buildWhere<T extends Record<string, unknown>>(
  filters: Partial<T>
): T {
  const where: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      where[key] = value
    }
  }
  
  return where as T
}

export function applyCursor<T extends Record<string, unknown>>(
  where: T, 
  cursor: string | null, 
  sortBy: keyof T, 
  sortDir: 'asc' | 'desc'
): T {
  if (!cursor) return where
  
  try {
    const { lastValue, lastId } = JSON.parse(Buffer.from(cursor, 'base64').toString())
    const op = sortDir === 'desc' ? 'lt' : 'gt'
    
    // Return Prisma-compatible where clause with cursor pagination
    return { 
      ...where,
      OR: [
        { [sortBy]: { [op]: lastValue } },
        { [sortBy]: lastValue, id: { [op]: lastId } },
      ]
    } satisfies T
  } catch {
    throw err('VALIDATION_ERROR', 'Invalid cursor') // See error-handling.md for err() usage
  }
}

export function buildOrderBy(sortBy: string, sortDir: 'asc' | 'desc') {
  return [{ [sortBy]: sortDir }, { id: sortDir }] // Automatic tie-breaker
}

export function buildPagination<T extends { id: string }>(
  items: T[], 
  limit: number, 
  sortField: keyof T
): { items: T[]; hasNext: boolean; nextCursor?: string } {
  const hasNext = items.length > limit
  const finalItems = hasNext ? items.slice(0, limit) : items
  
  if (!hasNext || finalItems.length === 0) {
    return { items: finalItems, hasNext: false }
  }
  
  const lastItem = finalItems[finalItems.length - 1]
  const nextCursor = Buffer.from(JSON.stringify({
    lastValue: lastItem[sortField],
    lastId: lastItem.id,
  })).toString('base64')
  
  return { items: finalItems, hasNext, nextCursor }
}
```

## Service Pattern (With Helpers)

Clean service implementation using helper utilities for consistent query building and pagination.

```typescript
export async function listCharacters(params: ListCharactersParams): Promise<ListCharactersResult> {
  const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc' } = params

  // Build where clause - zero boilerplate
  const where = buildWhere<Prisma.CharacterWhereInput>({
    visibility: params.visibility,
    raceId: params.raceId,
    archetypeId: params.archetypeId,
    level: params.level && { gte: params.minLevel, lte: params.maxLevel },
    ownerId: params.ownerId,
  })

  // Apply cursor pagination
  const whereWithCursor = applyCursor(where, cursor, sortBy, sortDir)

  // Execute query
  const items = await prisma.character.findMany({
    where: whereWithCursor,
    orderBy: buildOrderBy(sortBy, sortDir), // Automatic tie-breaker
    take: limit + 1,
  })

  // Build response
  const { items: finalItems, hasNext, nextCursor } = buildPagination(items, limit, sortBy)
  
  return {
    items: finalItems,
    pagination: { limit, cursor: { next: nextCursor } },
  }
}
```

## Advanced Query Helpers (Examples)

Specialized utilities for complex filtering scenarios like ranges, search, and validation.

```typescript
// Range filters - returns Prisma-compatible filter object
export function buildRangeFilter(min?: number, max?: number) {
  if (!min && !max) return undefined
  return { ...(min && { gte: min }), ...(max && { lte: max }) }
}

// Text search - returns Prisma-compatible OR clause
export function buildTextSearch(search?: string, fields: string[] = ['name']) {
  if (!search) return undefined
  return { OR: fields.map(field => ({ [field]: { contains: search, mode: 'insensitive' } })) }
}

// Usage
const where = buildWhere<Prisma.CharacterWhereInput>({
  visibility: params.visibility,
  level: buildRangeFilter(params.minLevel, params.maxLevel),
  ...buildTextSearch(params.search, ['name', 'description']),
})

  // Range validation helper
  export function validateRange(
    min: number | undefined, 
    max: number | undefined, 
    minFieldName: string, 
    maxFieldName: string
  ): void {
    if (min !== undefined && max !== undefined && min > max) {
      throw err('VALIDATION_ERROR', `${minFieldName} cannot be greater than ${maxFieldName}`) // See error-handling.md
    }
    if (min !== undefined && min < 0) {
      throw err('VALIDATION_ERROR', `${minFieldName} must be positive`)
    }
    if (max !== undefined && max < 0) {
      throw err('VALIDATION_ERROR', `${maxFieldName} must be positive`)
    }
  }

// Validate before query
validateRange(params.minLevel, params.maxLevel, 'minLevel', 'maxLevel')
```
