# API Versioning Implementation

Current versioning strategy and patterns for maintaining API compatibility.

## Current Implementation Status

**✅ Implemented:**

- URL versioning with `/api/v1/` prefix
- Feature-based v1 folder structure
- Shared business logic across versions
- Version-specific HTTP schemas and controllers

## Core Pattern

Use URL versioning with major versions only: `/api/v1/`, `/api/v2/`

## Actual File Structure

Current implementation follows this structure:

```typescript
src/
  features/
    characters/
      v1/
        characters.controller.ts    # v1 HTTP handling
        characters.http.schema.ts   # v1 request/response schemas
        characters.routes.ts        # v1 route definitions
      characters.service.ts         # Shared business logic (version-agnostic)
      characters.repository.ts      # Database access layer
      characters.domain.schema.ts   # Domain schemas and types
      characters.type.ts            # Type exports barrel
      index.ts                      # Feature barrel exports
```

**Note**: No adapters are currently implemented since only v1 exists. The
adapter pattern will be added when v2 is needed.

## Route Registration

Routes are registered in `src/app.ts` with version prefixes:

```typescript
// API v1 routes
await app.register(authRoutesV1, { prefix: '/api/v1' })
await app.register(usersRoutesV1, { prefix: '/api/v1' })
await app.register(charactersRoutesV1, { prefix: '/api/v1' })
// ... other v1 routes
```

## Implementation Steps (for v2)

When v2 is needed:

1. **Keep services version-agnostic** in feature root
2. **Add v2 folders** within each feature for new API contracts
3. **Create adapters** to convert domain objects to version-specific formats
4. **Register v2 routes** with `/api/v2` prefix

## Breaking vs Non-Breaking

**Breaking (new version needed):**

- Remove/change existing fields
- Change field types
- Remove endpoints

**Non-Breaking (same version OK):**

- Add optional fields
- Add new endpoints
- Add optional parameters

## Future Pattern (v2 Implementation)

When v2 is implemented, the structure will expand to:

```typescript
src/
  features/
    characters/
      v1/
        characters.controller.ts
        characters.http.schema.ts
        characters.routes.ts
      v2/
        characters.controller.ts    # v2-specific HTTP handling
        characters.http.schema.ts   # v2-specific validation schemas
        characters.routes.ts        # v2 route definitions
        characters.adapter.ts       # Domain → v2 API conversion
      characters.service.ts         # Shared business logic
      characters.repository.ts      # Database access layer
      characters.domain.schema.ts   # Domain schemas
```

## Adapter Pattern (Planned)

When v2 is needed, adapters will handle version-specific transformations:

```typescript
// Future adapter pattern (not yet implemented)
function toCharacterV1(domain: Character): CharacterV1 {
  return {
    id: domain.id,
    name: domain.name,
    // v1 format
  }
}

function toCharacterV2(domain: Character): CharacterV2 {
  return {
    id: domain.id,
    fullName: domain.name, // Breaking change: renamed field
    metadata: {
      // Breaking change: nested structure
      level: domain.level,
      // v2 format
    },
  }
}

// Controller usage
export const characterControllerV2 = {
  async getCharacter(req, reply) {
    const character = await characterService.getById(req.params.id)
    const v2Character = toCharacterV2(character)
    return reply.send(success(v2Character))
  },
} as const
```
