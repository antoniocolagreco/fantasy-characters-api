# Role-Based Access Control (RBAC) — Complete Specification

This document defines how authorization works in the Fantasy Characters API. It
is the single source of truth for who can do what, providing both theoretical
foundation and practical implementation guidance.

**Non-goals**: authentication, OAuth, password policies, or general security
hardening — see other docs for those.

---

## RBAC Model Overview

### Roles

- **ADMIN**: System administrators with full access
- **MODERATOR**: Content moderators with limited admin privileges
- **USER**: Regular users with basic access
- **Anonymous**: Non-authenticated users (no JWT)

### Resources

- `users`, `characters`, `images`, `tags`, `items`, `races`, `archetypes`,
  `skills`, `perks`, `equipment`

### Actions

- `read` (list/get operations)
- `create` (new resource creation)
- `update` (modify existing resources)
- `delete` (remove resources)
- `manage` (administrative operations: role changes, bans)

### Core Concepts

- **Ownership**: Most resources have `ownerId` field
- **Visibility**: Resources have visibility ∈ {`PUBLIC`, `PRIVATE`, `HIDDEN`}
- **Owner Role**: The role of the resource owner (for moderation logic)
- **Target User Role**: For user-related operations (bans, role changes)

---

## Permission Matrix by Role

| Role          | Own Content | Others' PUBLIC | Others' PRIVATE/HIDDEN | USER Content (MOD) | ADMIN Content (MOD) |
| ------------- | :---------: | :------------: | :--------------------: | :----------------: | :-----------------: |
| **ADMIN**     |   ✅ All    |     ✅ All     |         ✅ All         |       ✅ All       |   ✅ Read-only\*    |
| **MODERATOR** |   ✅ All    |     ✅ All     |      ✅ Read-only      |  ✅ Update/Delete  |    ❌ Read-only     |
| **USER**      |   ✅ All    |  ✅ Read-only  |       ❌ Denied        |     ❌ Denied      |      ❌ Denied      |
| **Anonymous** |   ❌ N/A    |  ✅ Read-only  |       ❌ Denied        |     ❌ Denied      |      ❌ Denied      |

\*_Exception: ADMIN cannot modify/delete other ADMIN accounts or change other
ADMIN roles_

---

## Detailed Permissions by Role

### USER (Basic Access)

**Can:**

- Read PUBLIC content and their own PRIVATE content
- Create content owned by themselves (`ownerId = self`)
- Update/Delete only their own content
- Use PUBLIC content created by others (no copy required)
- Transfer ownership of their own content to another user
- Abandon ownership (set `ownerId = null` → orphaned)
- Read/Update their own profile, change password, delete own account

**Cannot:**

- Modify/Delete content owned by others
- Manage orphaned content
- Read others' PRIVATE/HIDDEN content
- Modify other user accounts or roles
- Access admin-only functions or statistics

### MODERATOR (Content Management)

**Inherits**: All USER permissions

**Can:**

- Read any resource (any visibility, including user profiles)
- Update/Delete USER-owned content
- Update/Delete orphaned content (`ownerId = null`)
- Change visibility of USER-owned/orphaned entities
- View user lists, profiles, and basic statistics
- Ban/Unban USER accounts; set ban windows/dates
- Restore content from HIDDEN visibility (only MODERATOR/ADMIN can do this)

**Cannot:**

- Modify content owned by MODERATOR or ADMIN (read-only access)
- Create content on behalf of others
- Change user roles or edit user profile fields (except ban status/dates)
- Act on MODERATOR or ADMIN accounts (cannot ban, modify, or delete)
- Access sensitive/system administration functions

### ADMIN (System Administration)

**Inherits**: All USER and MODERATOR permissions

**Can:**

- Create/Read/Update/Delete any resource
- Manage USER and MODERATOR accounts and roles
- Access system statistics, logs, and monitoring
- Modify system settings and security policies

**Cannot:**

- Modify/Delete other ADMIN accounts
- Change roles/permissions of other ADMIN accounts

---

## Evaluation Logic (Short-Circuit)

The permission evaluation follows this order:

1. **Anonymous**: Allow `read` only on `PUBLIC` resources; deny all other
   actions

2. **ADMIN**: Allow all actions on all resources, **except**:
   - Cannot modify/delete other ADMIN accounts
   - Cannot change other ADMIN roles

3. **Owner**: If `user.id === ownerId`, allow `read/create/update/delete` on own
   resources, **except**:
   - Never allow `manage` on `users` resource (no role changes)

4. **MODERATOR** (non-owner):
   - `read`: Allowed on any resource
   - For content resources (not `users`):
     - `update`/`delete` allowed when `ownerId` is `null` (orphaned) or
       `ownerRole = USER`
     - Read-only when `ownerRole ∈ {MODERATOR, ADMIN}`
   - For `users` resource:
     - `manage` (ban/unban) allowed only on `USER` targets
     - Cannot change roles or edit profiles
     - Cannot act on MODERATOR or ADMIN accounts

5. **USER** (non-owner): Allow `read` on `PUBLIC` only; deny all other actions

---

## Special Rules

### Equipment Resources

- Follow the character's owner rules
- Equipment permissions are inherited from the associated character

### Visibility Lock

- When an entity is set to `HIDDEN`, only MODERATOR/ADMIN can restore it to
  `PUBLIC`/`PRIVATE`
- USER owners cannot unhide their own content

### Users Resource Specifics

- **Self-service**: Users can read/update their own profile except protected
  fields (`role`, `isBanned`, `isActive`)
- **Moderators**: Can ban/unban USER accounts via dedicated endpoints; cannot
  change roles or edit other profile fields; cannot act on MODERATOR or ADMIN
  accounts
- **Admins**: Can manage roles/ban flags for USER and MODERATOR accounts; cannot
  modify/delete other ADMIN accounts or change other ADMIN roles

### Ownership Transfer

- Owners may transfer ownership of their entities to another user (server
  validates target)
- Owners may abandon ownership by setting `ownerId` to `null` (creates orphaned
  content)

---

## Implementation Guide

### TypeScript Types

```ts
export type Role = 'ADMIN' | 'MODERATOR' | 'USER'
export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage'
export type Resource =
  | 'users'
  | 'characters'
  | 'images'
  | 'tags'
  | 'items'
  | 'races'
  | 'archetypes'
  | 'skills'
  | 'perks'
  | 'equipment'
export type Visibility = 'PUBLIC' | 'PRIVATE' | 'HIDDEN'

export interface RbacContext {
  user?: { id: string; role: Role }
  resource: Resource
  action: Action
  ownerId?: string
  visibility?: Visibility
  ownerRole?: Role // Role of the resource owner
  targetUserRole?: Role // For user operations (bans, role changes)
}
```

### Core Policy Function

```ts
// src/common/middleware/rbac.policy.ts
export function can(ctx: RbacContext): boolean {
  const {
    user,
    resource,
    action,
    ownerId,
    visibility,
    ownerRole,
    targetUserRole,
  } = ctx
  const role = user?.role

  // 1) Anonymous
  if (!role) return action === 'read' && visibility === 'PUBLIC'

  // 2) Admin
  if (role === 'ADMIN') {
    // Cannot modify/delete other ADMIN accounts or change their roles
    if (
      resource === 'users' &&
      (action === 'update' || action === 'delete' || action === 'manage')
    ) {
      const targetIsAdmin = targetUserRole === 'ADMIN'
      const actingOnSelf = !!user && !!ownerId && user.id === ownerId
      if (targetIsAdmin && !actingOnSelf) return false
    }
    return true
  }

  // 3) Owner
  const isOwner = !!user && !!ownerId && user.id === ownerId
  if (isOwner) {
    if (resource === 'users' && action === 'manage') return false
    return action !== 'manage'
  }

  // 4) Moderator (non-owner)
  if (role === 'MODERATOR') {
    if (action === 'read') return true

    // Users resource: can only manage bans for USER targets
    if (resource === 'users') {
      if (action === 'manage') return targetUserRole === 'USER'
      return false
    }

    // Content resources: can update/delete USER-owned or orphaned content
    const isOrphan = ownerId == null
    const ownedByUser = ownerRole === 'USER'
    if (
      (action === 'update' || action === 'delete') &&
      (isOrphan || ownedByUser)
    ) {
      return true
    }

    return false
  }

  // 5) Regular user (non-owner)
  return action === 'read' && visibility === 'PUBLIC'
}
```

### Route Metadata

```ts
// Add RBAC hints to Fastify route options
{
  config: {
    rbac: {
      resource: 'characters',
      action: 'create' | 'read' | 'update' | 'delete' | 'manage',
      ownership: 'own' | 'any' | 'public'  // Optional hint
    }
  }
}
```

### Ownership Resolution Helper

```ts
// src/common/middleware/rbac.resolve.ts
export async function resolveOwnership(
  req: any,
  resource: string
): Promise<{
  ownerId?: string
  visibility?: Visibility
  ownerRole?: Role
  targetUserRole?: Role
}> {
  // Characters example
  if (resource === 'characters' && req.params?.id) {
    const { id } = req.params
    const row = await req.prisma.character.findUnique({
      where: { id },
      select: {
        ownerId: true,
        visibility: true,
        owner: { select: { role: true } },
      },
    })
    return {
      ownerId: row?.ownerId,
      visibility: row?.visibility,
      ownerRole: row?.owner?.role,
    }
  }

  // Users example
  if (resource === 'users' && req.params?.id) {
    const { id } = req.params
    const row = await req.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    })
    return { ownerId: row?.id, targetUserRole: row?.role }
  }

  // Fallback for creation routes
  return {
    ownerId: req.body?.ownerId,
    visibility: req.body?.visibility,
  }
}
```

### Fastify PreHandler

```ts
// src/common/middleware/rbac.ts
import { can } from './rbac.policy'
import { err } from '@/shared/errors/factories'

export function rbacPreHandler(resource: Resource, action: Action) {
  return async function (req: any) {
    const disabled = process.env.RBAC_ENABLED === 'false'
    if (disabled) return // Allow all in test/dev environments

    if (!req.user && action !== 'read') {
      throw err('UNAUTHORIZED', 'Login required')
    }

    const meta = req.routeOptions?.config?.rbac || {}
    const resolved =
      meta.ownerId || meta.visibility
        ? meta
        : await resolveOwnership(req, resource)

    const ok = can({
      user: req.user,
      resource,
      action,
      ownerId: resolved.ownerId,
      visibility: resolved.visibility,
      ownerRole: resolved.ownerRole,
      targetUserRole: resolved.targetUserRole,
    })

    if (!ok) throw err('FORBIDDEN', 'Not allowed')
  }
}
```

### Route Registration Example

```ts
app.post(
  '/v1/characters',
  {
    config: { rbac: { resource: 'characters', action: 'create' } },
    preHandler: [authPreHandler, rbacPreHandler('characters', 'create')],
  },
  controller.createCharacter
)

app.put(
  '/v1/characters/:id',
  {
    config: { rbac: { resource: 'characters', action: 'update' } },
    preHandler: [authPreHandler, rbacPreHandler('characters', 'update')],
  },
  controller.updateCharacter
)
```

---

## API Examples

### 1. Public Character List

```http
GET /api/v1/characters?visibility=PUBLIC
```

- **All roles**: ✅ Allowed
- **Response**: Only PUBLIC characters returned

### 2. Create Character

```http
POST /api/v1/characters
{
  "name": "Aria",
  "ownerId": "user-123",
  "visibility": "PUBLIC"
}
```

- **Anonymous**: ❌ `UNAUTHORIZED` (401)
- **USER** (if ownerId = self): ✅ Created (201)
- **USER** (if ownerId ≠ self): ❌ `FORBIDDEN` (403)
- **MODERATOR/ADMIN**: ✅ Created (201)

### 3. Update Character

```http
PUT /api/v1/characters/char-456
{
  "name": "Aria Lightblade"
}
```

- **Owner**: ✅ Updated (200)
- **MODERATOR** (if owner = USER): ✅ Updated (200)
- **MODERATOR** (if owner = MODERATOR/ADMIN): ❌ `FORBIDDEN` (403)
- **ADMIN** (if owner ≠ ADMIN): ✅ Updated (200)
- **ADMIN** (if owner = other ADMIN): ❌ `FORBIDDEN` (403)

### 4. Ban User

```http
POST /api/v1/users/user-789/ban
{
  "isBanned": true,
  "banReason": "Spam"
}
```

- **USER**: ❌ `FORBIDDEN` (403)
- **MODERATOR** (if target = USER): ✅ Banned (200)
- **MODERATOR** (if target = MODERATOR/ADMIN): ❌ `FORBIDDEN` (403)
- **ADMIN** (if target = USER/MODERATOR): ✅ Banned (200)
- **ADMIN** (if target = other ADMIN): ❌ `FORBIDDEN` (403)

### 5. Visibility Moderation

```http
PUT /api/v1/characters/char-456
{
  "visibility": "PUBLIC"  // Changing from HIDDEN
}
```

- **USER** (owner): ❌ `FORBIDDEN` (403) - Cannot unhide own content
- **MODERATOR**: ✅ Updated (200) - Can restore visibility
- **ADMIN**: ✅ Updated (200) - Can restore visibility

---

## Error Codes

| Scenario                 | HTTP | Code                            | Message              |
| ------------------------ | ---- | ------------------------------- | -------------------- |
| No JWT token             | 401  | `UNAUTHORIZED`                  | "Login required"     |
| Invalid/expired token    | 401  | `TOKEN_INVALID`/`TOKEN_EXPIRED` | "Invalid token"      |
| Insufficient permissions | 403  | `FORBIDDEN`                     | "Not allowed"        |
| Resource not found       | 404  | `RESOURCE_NOT_FOUND`            | "Resource not found" |
| Owner mismatch           | 403  | `FORBIDDEN`                     | "Not allowed"        |
| Try to ban admin         | 403  | `FORBIDDEN`                     | "Not allowed"        |

---

## Service-Level Implementation

Always re-check permissions in services, even if route preHandlers are present:

```ts
async function updateCharacter(id: string, data: any, user: User) {
  const character = await prisma.character.findUnique({
    where: { id },
    include: { owner: { select: { role: true } } },
  })

  if (!character) throw err('RESOURCE_NOT_FOUND')

  // RBAC check
  if (
    !can({
      user,
      resource: 'characters',
      action: 'update',
      ownerId: character.ownerId,
      visibility: character.visibility,
      ownerRole: character.owner?.role,
    })
  ) {
    throw err('FORBIDDEN')
  }

  return prisma.character.update({ where: { id }, data })
}
```

### Response Filtering

Filter responses based on permissions:

```ts
function filterUserProfile(user: User, viewer: User | null) {
  const isOwner = viewer?.id === user.id
  const isModerator = viewer?.role === 'MODERATOR' || viewer?.role === 'ADMIN'

  if (isOwner || isModerator) {
    return user // Full profile
  }

  // Public fields only
  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt,
  }
}
```
