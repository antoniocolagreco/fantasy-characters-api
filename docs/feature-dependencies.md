# Feature Dependencies

Managing dependencies between features with clear and unidirectional rules.

## Key Rule: Always Unidirectional

```text
SHARED ← INFRASTRUCTURE ← USER ← AUTH (with RBAC) ← FEATURES (protected)
```

**Never circular**: Dependencies flow in one direction only.

## Actual Implementation Analysis

### ✅ Correctly Implemented Dependencies

```typescript
// ✅ auth.service imports user.service for credential verification
import { userService } from '@/features/users'

// ✅ auth.service imports shared utilities and infrastructure
import { config } from '@/infrastructure/config'
import { err } from '@/shared/errors'

// ✅ user.service imports auth types (not services) and password utilities
import type { AuthenticatedUser } from '@/features/auth'
import { passwordService } from '@/features/auth/password.service'

// ✅ RBAC middleware and policies are part of auth feature
import { rbac } from '@/features/auth/rbac.middleware'
```

### Architecture Clarifications

**RBAC is integrated within AUTH feature**, not separate:

- `rbac.middleware.ts` and `rbac.policy.ts` live in `/features/auth/`
- RBAC helpers are in `/shared/utils/` for reuse across services
- No separate "rbac.service" - policies are pure functions

**User service has minimal auth dependencies**:

- Imports `AuthenticatedUser` type (not services)
- Uses `passwordService` for hashing (password utilities, not auth logic)
- RBAC checks use shared helpers, not auth services

## Middleware Architecture

**Authentication**: `auth.middleware.ts`

- Verifies JWT tokens
- Attaches user info to request
- No service calls - pure JWT validation

**Authorization**: `rbac.middleware.ts`

- Uses policy functions to check permissions
- Resolves ownership from database
- Throws errors for unauthorized access

**Service Layer**: Clean separation

- Services receive `AuthenticatedUser` type from middleware
- Services use RBAC helpers for filtering
- No JWT knowledge in services

## Request Flow Example

1. **Protected Request**: Client sends JWT in Authorization header
2. **Auth Middleware**: Verifies JWT → attaches `user` to request
3. **RBAC Middleware**: Checks permissions using policies
4. **Controller**: Extracts data → calls service with user context
5. **Service**: Applies security filters → calls repository
6. **Repository**: Executes secure database queries

## Feature Structure

```text
src/features/
├── users/           # Base layer: user data management
│   ├── users.service.ts     # ← No auth service dependencies
│   └── users.repository.ts
├── auth/            # Authentication + RBAC layer
│   ├── auth.service.ts      # → Uses user.service
│   ├── auth.middleware.ts   # JWT verification
│   ├── rbac.middleware.ts   # Permission checking
│   ├── rbac.policy.ts       # Policy functions
│   └── password.service.ts  # ← Used by user.service
└── characters/      # Protected features
    ├── characters.service.ts # ← Uses AuthenticatedUser type
    └── v1/routes.ts         # → Uses RBAC middleware
```

## Implementation Order

1. **Infrastructure**: Database, logging, config
2. **Shared**: Error handling, validation, RBAC helpers
3. **Users**: User CRUD, roles, profiles
4. **Auth**: JWT, login/register, middleware, RBAC policies
5. **Protected Features**: Characters, Items, etc. (use auth middleware)

## Dependency Rules

### ✅ ALLOWED

- `auth.service` → `user.service` (credential verification)
- `user.service` → `passwordService` (password utilities)
- `user.service` → `AuthenticatedUser` type (type imports)
- All services → `shared/utils/rbac.helpers` (security filtering)
- All routes → `auth/rbac.middleware` (authorization)
- Infrastructure → `shared` utilities

### ❌ FORBIDDEN

- `user.service` → `auth.service` (would create circular dependency)
- Services → JWT token handling (middleware responsibility)
- Repositories → RBAC logic (should receive pre-filtered queries)
- Features → other features (except through shared utilities)
- `shared` → feature-specific code

## Best Practices

- **Type-only imports**: Use `import type` for AuthenticatedUser
- **Utility separation**: RBAC helpers in `/shared/utils/` for reuse
- **Middleware composition**: Chain auth + RBAC middleware in routes
- **Service isolation**: Pass user context, let service apply security
- **Repository purity**: Repositories execute queries, no security logic
