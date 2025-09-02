# API Versioning Quick Reference

URL versioning strategy for maintaining API compatibility.

## Core Pattern

Use URL versioning with major versions only: `/api/v1/`, `/api/v2/`

## File Structure

Organize versioned code following [project-structure.md](./project-structure.md) patterns:

```typescript
src/
  features/
    characters/
      v1/
        controller.ts    # v1-specific HTTP handling
        schema.ts        # v1-specific validation schemas
        route.ts         # v1 route definitions
        adapter.ts       # Domain → v1 API conversion
      v2/
        controller.ts    # v2-specific HTTP handling
        schema.ts        # v2-specific validation schemas
        route.ts         # v2 route definitions
        adapter.ts       # Domain → v2 API conversion
      service.ts         # Shared business logic (version-agnostic)
      repository.ts      # Database access layer
      types.ts           # Domain types
      index.ts           # Barrel exports
```

## Implementation Steps

1. **Keep services version-agnostic** in feature root
2. **Add version folders** within each feature for API contracts
3. **Use adapters** to convert domain objects to version-specific formats
4. **Register routes** by version in main app

## Breaking vs Non-Breaking

**Breaking (new version needed):**

- Remove/change existing fields
- Change field types
- Remove endpoints

**Non-Breaking (same version OK):**

- Add optional fields
- Add new endpoints
- Add optional parameters

## Key Code Pattern

```ts
// Service (shared, version-agnostic)
async function getCharacter(id: string) { /* business logic */ }

// Repository (shared, version-agnostic)  
async function findCharacterById(id: string) { /* database access */ }

// Adapter (version-specific)
function toCharacterV1(domain: Character): CharacterV1 { return { /* v1 format */ } }

// Controller (version-specific)  
async function getCharacterV1Handler(req, reply) {
  const character = await getCharacter(req.params.id)
  const v1Character = toCharacterV1(character)
  return reply.send(success(v1Character)) // Uses response-templates.md patterns
}
```
