# AI Query & Validation

Essential patterns for schema-first query handling and validation using TypeBox.

## Critical Rules

Fundamental principles that must be followed to maintain code quality and
consistency.

1. **Always compose from base schemas** -
   `Type.Intersect([PaginationQuery, SortQuery, ...])`
2. **Always derive types** - `type Params = Static<typeof Schema>`
3. **Use query helpers** - `buildWhere()`, `applyCursor()`, `buildPagination()`
4. **Always sort with tie-breaker** - Use `buildOrderBy()` for automatic `id`
   tie-breaker
5. **Always validate business rules** - Check min/max relationships
6. **Always apply RBAC** - Filter by user permissions in service
7. **Never use `any` types** - Use Prisma generated types or proper unions
8. **Never use type assertions** - Use type guards and explicit field access

## Core Pattern

Schema-first approach eliminates type duplication and ensures runtime validation
matches TypeScript types.

Define once with TypeBox → Derive TypeScript types → Use everywhere

```typescript
// 1. Define schema
export const CharactersListQuery = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  cursor: Type.Optional(Type.String()),
  visibility: Type.Optional(
    Type.Union([
      Type.Literal('PUBLIC'),
      Type.Literal('PRIVATE'),
      Type.Literal('HIDDEN'),
    ])
  ),
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
// src/shared/schemas/query.schema.ts (centralized exports)
export const PaginationQuerySchema = Type.Object(
  {
    limit: Type.Optional(
      Type.Integer({ minimum: 1, maximum: 100, default: 20 })
    ),
    cursor: Type.Optional(Type.String()),
  },
  { $id: 'PaginationQuery' }
)

export const VisibilityQuerySchema = Type.Object(
  {
    visibility: Type.Optional(VisibilitySchema),
  },
  { $id: 'VisibilityQuery' }
)

export const SortQuerySchema = Type.Object(
  {
    sortBy: Type.Optional(
      Type.String({
        enum: ['createdAt', 'updatedAt', 'name'],
      })
    ),
    sortDir: Type.Optional(
      Type.String({
        enum: ['asc', 'desc'],
        default: 'desc',
      })
    ),
  },
  { $id: 'SortQuery' }
)

export const SearchQuerySchema = Type.Object(
  {
    search: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
      })
    ),
  },
  { $id: 'SearchQuery' }
)

// Combined query schema with all standard parameters
export const StandardQuerySchema = Type.Intersect(
  [
    PaginationQuerySchema,
    SortQuerySchema,
    VisibilityQuerySchema,
    SearchQuerySchema,
  ],
  { $id: 'StandardQuery' }
)

// Derive types
export type PaginationQuery = Static<typeof PaginationQuerySchema>
export type VisibilityQuery = Static<typeof VisibilityQuerySchema>
export type SortQuery = Static<typeof SortQuerySchema>
export type SearchQuery = Static<typeof SearchQuerySchema>
export type StandardQuery = Static<typeof StandardQuerySchema>
```

## Route Implementation

Fastify route registration with automatic TypeBox validation and typed request
objects. For consistent response formatting, see
[response-templates.md](./response-templates.md).

```typescript
// Register route with schema validation
app.get(
  '/characters',
  {
    schema: {
      tags: ['characters'],
      querystring: CharactersListQuery,
      response: { 200: CharactersListResponse },
    },
  },
  async (req, reply) => {
    const query = req.query // Automatically typed

    // Validate business rules with reusable helper
    validateRange(query.minLevel, query.maxLevel, 'minLevel', 'maxLevel')

    const result = await characterService.listCharacters({
      ...query,
      userId: req.user?.id,
    })
    return reply.send(paginated(result.data, result.pagination, req.id))
  }
)
```

## Query Helpers (Minimal Boilerplate)

Generic utilities to transform query params into Prisma where conditions with
zero repetitive code.

```typescript
// src/shared/utils/query.helper.ts
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
  sortDir: string
): T {
  if (!cursor) return where

  // Validate sortDir at runtime
  if (sortDir !== 'asc' && sortDir !== 'desc') {
    throw err('VALIDATION_ERROR', 'Invalid sort direction')
  }

  try {
    const { lastValue, lastId } = JSON.parse(
      Buffer.from(cursor, 'base64').toString()
    )
    const op = sortDir === 'desc' ? 'lt' : 'gt'

    // Return Prisma-compatible where clause with cursor pagination
    return {
      ...where,
      OR: [
        { [sortBy]: { [op]: lastValue } },
        { [sortBy]: lastValue, id: { [op]: lastId } },
      ],
    } satisfies T
  } catch {
    throw err('VALIDATION_ERROR', 'Invalid cursor') // See error-handling.md for err() usage
  }
}

export function buildOrderBy(sortBy: string, sortDir?: string) {
  // Validate sortDir at runtime
  if (sortDir && sortDir !== 'asc' && sortDir !== 'desc') {
    throw err('VALIDATION_ERROR', 'Invalid sort direction')
  }
  const direction = sortDir || 'desc'
  return [{ [sortBy]: direction }, { id: direction }] // Automatic tie-breaker
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
  if (!lastItem) {
    return { items: finalItems, hasNext: false }
  }

  const nextCursor = Buffer.from(
    JSON.stringify({
      lastValue: lastItem[sortField],
      lastId: lastItem.id,
    })
  ).toString('base64')

  return { items: finalItems, hasNext, nextCursor }
}

// Range validation helper
export function validateRange(
  min: number | undefined,
  max: number | undefined,
  minFieldName: string,
  maxFieldName: string
): void {
  if (min !== undefined && max !== undefined && min > max) {
    throw err(
      'VALIDATION_ERROR',
      `${minFieldName} cannot be greater than ${maxFieldName}`
    )
  }
  if (min !== undefined && min < 0) {
    throw err('VALIDATION_ERROR', `${minFieldName} must be positive`)
  }
  if (max !== undefined && max < 0) {
    throw err('VALIDATION_ERROR', `${maxFieldName} must be positive`)
  }
}
```

## Service Pattern (With Helpers)

Clean service implementation using helper utilities for consistent query
building and pagination.

```typescript
export const characterService = {
  async list(query: CharacterListQuery, user?: AuthenticatedUser) {
    const businessFilters: Record<string, unknown> = {}

    if (query.visibility !== undefined)
      businessFilters.visibility = query.visibility
    if (query.search) {
      businessFilters.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    // Helper for range construction & validation
    function range(min?: number, max?: number) {
      if (min !== undefined && max !== undefined && min > max) {
        throw err(
          'VALIDATION_ERROR',
          'Min value cannot be greater than max value'
        )
      }
      if (min === undefined && max === undefined) return undefined
      return {
        ...(min !== undefined ? { gte: min } : {}),
        ...(max !== undefined ? { lte: max } : {}),
      }
    }

    const levelRange = range(query.levelMin, query.levelMax)
    if (levelRange) businessFilters.level = levelRange

    // Apply security filters
    const secureFilters = applySecurityFilters(businessFilters, user)

    // Execute query with secure filters
    const { characters, hasNext, nextCursor } =
      await characterRepository.findMany({
        ...query,
        filters: secureFilters,
      })

    const masked = characters.map(c => maskHiddenEntity(c, user) as Character)

    return {
      characters: masked,
      pagination: {
        hasNext,
        hasPrev: !!query.cursor,
        limit: query.limit ?? 20,
        ...(nextCursor && { nextCursor }),
        ...(query.cursor && { startCursor: query.cursor }),
      },
    }
  },

  // ... other character operations
} as const
```

## Advanced Query Helpers (Examples)

Specialized utilities for complex filtering scenarios like ranges, search, and
validation.

```typescript
// Helper for range construction & validation (from characters.service.ts)
function range(min?: number, max?: number) {
  if (min !== undefined && max !== undefined && min > max) {
    throw err('VALIDATION_ERROR', 'Min value cannot be greater than max value')
  }
  if (min === undefined && max === undefined) return undefined
  return {
    ...(min !== undefined ? { gte: min } : {}),
    ...(max !== undefined ? { lte: max } : {}),
  }
}

// Text search (from characters.service.ts)
if (query.search) {
  businessFilters.OR = [
    { name: { contains: query.search, mode: 'insensitive' } },
    { description: { contains: query.search, mode: 'insensitive' } },
  ]
}

// Usage examples
const levelRange = range(query.levelMin, query.levelMax)
if (levelRange) businessFilters.level = levelRange

const experienceRange = range(query.experienceMin, query.experienceMax)
if (experienceRange) businessFilters.experience = experienceRange
```
