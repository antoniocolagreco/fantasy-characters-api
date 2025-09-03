# Feature Dependencies

Managing dependencies between features with clear and unidirectional rules.

## 💡 Key Rule: Always Unidirectional

```text
USER (base) ← AUTH ← RBAC ← FEATURES (protected)
```

**Never circular**: User is the lowest layer, auth above, rbac above.

## Dependencies Between Services

```typescript
// ✅ Correct: auth.service uses user.service
auth.service → user.service // to check credentials

// ✅ Correct: rbac.service uses auth info
rbac.service → token/user info // to understand who is logged in

// ❌ Never: user.service MUST NOT depend on auth or rbac
user.service ✗ auth.service // NO!
```

## Middleware to Simplify

**Authentication**: middleware verifies JWT → calls `auth.service`
**Authorization**: RBAC middleware checks permissions → calls `rbac.service`

Controllers and services remain clean, without knowing anything about tokens or permissions.

## Example Login + Authorization Flow

1. **Login**: `auth.controller` → `auth.service` → `user.service` verifies
   credentials
2. **JWT generated** and returned
3. **Protected request**: auth middleware verifies JWT
4. **RBAC middleware** checks role/permissions
5. **Controller called** only if everything is ok

## Logical Summary

- **User feature** → user data management (base)
- **Auth feature** → login, tokens, credential verification (depends on User)
- **RBAC feature** → role/permission management, called by middleware (depends on
  Auth)
- **Other features** → Characters, Items, etc. (protected by RBAC)

## Implementation Order

1. **Infrastructure**: Database, logging, config
2. **Shared**: Error handling, validation, utilities
3. **User**: User CRUD, roles, profiles
4. **Auth**: JWT, login/register, auth middleware
5. **RBAC**: Policy, authorization middleware
6. **Other features**: Characters, Items, etc. (in parallel after RBAC)

## Rules to Follow

- ✅ Dependencies always downward
- ✅ Middleware handles auth/rbac
- ✅ Services know nothing about JWT/tokens
- ✅ Controllers don't access DB directly
- ❌ Never circular dependencies
- ❌ Never skip foundation layers
