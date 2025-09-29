# Authorization & RBAC

## Security Architecture

API req## Implementation

### 1. Middleware Layer

**Purpose**: Authenticate users and check if their ROLE can access the ROUTE.w through three security layers:

```text
MIDDLEWARE → SERVICE → REPOSITORY
```ion Guide

**Core Principle**: Security is handled at 3 different layers. Each layer has a
single, clear responsibility and works together to create defense in depth.

---

## 🏗️ **3-Layer Security Architecture**

Your API request flows through 3 layers, each doing one specific job:

```text
1. MIDDLEWARE  →  2. SERVICE  →  3. REPOSITORY
   "Can this      "What can     "Execute the
    user access    THIS user     database query
    this route?"   do with       with filters"
                   THIS data?"
```

### Layer Responsibilities

| Layer        | Responsibility                        |
| ------------ | ------------------------------------- |
| MIDDLEWARE   | Route-level role authorization        |
| SERVICE      | Business logic and resource ownership |
| REPOSITORY   | Execute pre-filtered queries          |

---

## Roles & Permissions

### User Roles

- **ADMIN**: Can do everything except, modify other admins. Can promote users to
  moderator and viceversa.
- **MODERATOR**: Manages USER content, can see HIDDEN content. Can edit/delete
  content, ban/unban users, can't create/update/delete users.
- **USER**: Only manages their own content
- **Anonymous**: Only reads PUBLIC content

### **Permission Matrix**

| Role      | Own Content | Others' PUBLIC | Others' PRIVATE/HIDDEN |  Manage USERs  | Manage ADMINs |
| --------- | :---------: | :------------: | :--------------------: | :------------: | :-----------: |
| ADMIN     |   ✅ All    |     ✅ All     |         ✅ All         |     ✅ All     | ❌ Read-only  |
| MODERATOR |   ✅ All    |     ✅ All     |      ✅ Read-only      | ✅ Edit/Delete | ❌ Read-only  |
| USER      |   ✅ All    |  ✅ Read-only  |       ❌ Denied        |   ❌ Denied    |   ❌ Denied   |
| Anonymous |   ❌ N/A    |  ✅ Read-only  |       ❌ Denied        |   ❌ Denied    |   ❌ Denied   |

---

## Implementation

### **1. Middleware Layer**

**Purpose**: Authenticate users and check if their ROLE can access the ROUTE.

**Important**: This is NOT where you check ownership or specific permissions!

```typescript
export function rbac(resource: string, action: string) {
  return async (req: any) => {
    const { user } = req
    const role = user?.role

    if (!role) return action === 'read'

    const permissions = {
      ADMIN: ['read', 'create', 'update', 'delete', 'manage'],
      MODERATOR: ['read', 'create', 'update', 'delete'],
      USER: ['read', 'create', 'update', 'delete'],
    }

    const allowed = permissions[role]?.includes(action)
    if (!allowed) throw err('FORBIDDEN')
  }
}
```

Email verification middleware:

```typescript
if (
  action === 'create' &&
  user &&
  user.role !== 'ADMIN' &&
  user.role !== 'MODERATOR'
) {
  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isEmailVerified: true },
  })
  if (!row?.isEmailVerified) throw err('FORBIDDEN', 'Email not verified')
}
```

### 2. Service Layer

**Purpose**: Business logic and authorization checks, resource ownership validation.

```typescript
export const imageService = {
  async listImages(params: any, user?: User) {
    const securityFilters = this.buildSecurityFilters(user)
    const filters = { ...securityFilters, tags: params.tags }
    return imageRepository.findImages(filters)
  },

  async updateImage(id: string, data: any, user: User) {
    const image = await imageRepository.findById(id)
    if (!image) throw err('NOT_FOUND')
    if (!this.canModify(user, image)) throw err('FORBIDDEN')
    return imageRepository.update(id, data)
  },

  buildSecurityFilters(user?: User) {
    if (!user) return { visibility: 'PUBLIC' }
    if (user.role === 'ADMIN') return {}
    if (user.role === 'MODERATOR') {
      return {
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'HIDDEN' },
          { ownerId: user.id },
        ],
      }
    }
    return {
      OR: [{ visibility: 'PUBLIC' }, { ownerId: user.id }],
    }
  },

  canModify(user: User, resource: any): boolean {
    if (resource.ownerId === user.id) return true
    if (user.role === 'ADMIN') return resource.ownerRole !== 'ADMIN'
    if (user.role === 'MODERATOR') return resource.ownerRole === 'USER'
    return false
  },
}
```

### 3. Repository Layer

**Purpose**: Execute database queries with pre-filtered, secure conditions.

```typescript
export const imageRepository = {
  // Takes pre-built filters and executes query
  async findImages(filters: any) {
    return prisma.image.findMany({
      where: filters, // These filters come pre-secured from service
      include: { owner: { select: { role: true } } },
    })
  },

  async findById(id: string) {
    return prisma.image.findUnique({
      where: { id },
      include: { owner: { select: { role: true } } },
    })
  },

  async update(id: string, data: any) {
    return prisma.image.update({ where: { id }, data })
  },
}
```

### **4. Controller Layer**

**Purpose**: Handle HTTP stuff (parameters, responses) and coordinate service
calls.

**Important**: Controller never makes security decisions!

```typescript
export const imageController = {
  async listImages(req: any, reply: any) {
    // Extract HTTP parameters
    const params = req.query
    const user = req.user // Set by auth middleware

    // Delegate everything to service
    const result = await imageService.listImages(params, user)
    return reply.send(result)
  },

  async updateImage(req: any, reply: any) {
    const { id } = req.params
    const data = req.body
    const user = req.user

    // Service handles all business logic and security
    await imageService.updateImage(id, data, user)
    return reply.code(204).send()
  },
}
```

---

## 🔄 **Complete Request Flow**

Let's trace a request: `GET /api/v1/images?tags=fantasy`

1. **MIDDLEWARE**: "Can USER role access /images route?" ✅ Yes, USERs can read
   images
2. **CONTROLLER**: Extract `tags=fantasy` and `user` from request, delegate to
   service
3. **SERVICE**: Build security filters for this user + combine with business
   filters
4. **REPOSITORY**: Execute database query with secure filters

```typescript
// What actually happens:
// 1. Middleware allows USER to access route
// 2. Controller extracts: { tags: "fantasy" }, user: { id: "123", role: "USER" }
// 3. Service builds filters: { OR: [{ visibility: "PUBLIC" }, { ownerId: "123" }], tags: "fantasy" }
// 4. Repository queries: SELECT * FROM images WHERE (visibility = 'PUBLIC' OR ownerId = '123') AND tags LIKE '%fantasy%'
```

**Result**: User only sees fantasy images they're allowed to see.

---

## Reusable Helpers

Create these utility functions to avoid repeating security logic:

```typescript
// Apply security constraints to any filter object
export function applySecurityFilters<T>(filters: T, user?: User): T {
  if (!user) return { ...filters, visibility: 'PUBLIC' } as T
  if (user.role === 'ADMIN') return filters

  const securityFilter =
    user.role === 'MODERATOR'
      ? {
          OR: [
            { visibility: 'PUBLIC' },
            { visibility: 'HIDDEN' },
            { ownerId: user.id },
          ],
        }
      : { OR: [{ visibility: 'PUBLIC' }, { ownerId: user.id }] }

  return { ...filters, ...securityFilter } as T
}

// Check if user can modify a specific resource
export function canModifyResource(user: User, resource: any): boolean {
  if (resource.ownerId === user.id) return true
  if (user.role === 'ADMIN') return resource.ownerRole !== 'ADMIN'
  if (user.role === 'MODERATOR') return resource.ownerRole === 'USER'
  return false
}

// Check if user can view a specific resource
export function canViewResource(
  user: User | undefined,
  resource: any
): boolean {
  if (!user) return resource.visibility === 'PUBLIC'
  if (user.role === 'ADMIN') return true
  if (resource.ownerId === user.id) return true
  if (user.role === 'MODERATOR')
    return ['PUBLIC', 'HIDDEN'].includes(resource.visibility)
  return resource.visibility === 'PUBLIC'
}
```

---

## ✅ **Best Practices**

### **DO**

- **Defense in depth**: Always re-check permissions in service even if
  middleware passed
- **Separation of concerns**: Each layer has ONE responsibility
- **Pre-secured filters**: Service builds filters, repository applies them
- **Consistent helpers**: Use centralized utilities for RBAC logic
- **Create gating**: Block create actions for non-verified USERs
  (middleware-level)

### **DON'T**

- **Repository with security**: Never put user/role logic in repository
- **Controller with business**: Never put RBAC checks in controller
- **Middleware with granular**: Never check ownership in middleware
- **Service without re-check**: Always re-validate permissions

---

## 🚨 **Common Mistakes**

```typescript
// ❌ WRONG: Repository knows about users
async findImagesSecure(user: User) {
  if (user.role === 'ADMIN') { /* NO! */ }
}

// ❌ WRONG: Controller makes security decisions
async deleteImage(req, reply) {
  if (req.user.id !== image.ownerId) throw err('FORBIDDEN') // NO!
}

// ❌ WRONG: Middleware checks ownership
async rbacMiddleware(req) {
  const image = await db.image.findUnique({ id: req.params.id }) // NO!
}

// ✅ CORRECT: Clean separation
// Middleware: route-level permissions
// Controller: HTTP coordination (no security)
// Service: business logic + granular RBAC
// Repository: pure data access
```

---

## Quick Templates

### **Route Setup**

```typescript
app.METHOD(
  '/resource/:id?',
  {
    preHandler: [authMiddleware, rbac('resource', 'action')],
  },
  controller.method
)
```

### **Service Method**

```typescript
async serviceMethod(params: any, user: User) {
  const resource = await repository.findById(params.id)
  if (!canDoAction(user, resource)) throw err('FORBIDDEN')
  return repository.doAction(params)
}
```

### **Security Filtering**

```typescript
const filters = applySecurityFilters(businessFilters, user)
const results = await repository.find(filters)
```
