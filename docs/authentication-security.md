# Authentication & Security

## Authentication System

### JWT Token Management

The API uses a secure JWT authentication system with the following components:

- **Access Tokens**: Short-lived tokens (15 minutes) for API authentication
- **Refresh Tokens**: Long-lived tokens (7 days) for token renewal
- **Password Hashing**: Argon2 with configurable memory, time, and parallelism parameters
- **Session Management**: Device tracking and revocation capabilities

### OAuth Integration

- **Google OAuth**: Social login via Google accounts
- **GitHub OAuth**: Developer-focused authentication
- **Session-based OAuth flow**: Secure OAuth state management

## Ownership & Sharing System

The API implements a **Flexible Ownership** system that balances user autonomy with content sharing:

### Core Principles

- **User Autonomy**: Users have complete control over their entities (can modify/delete freely)
- **Content Sharing**: Users can access and use all public entities created by others
- **Ownership Transfer**: Users can abandon ownership, making entities community-managed
- **Cascade Protection**: Entities in use by others are preserved when owners leave

### How It Works

1. **Public Entities**: Users can mark their entities as `visibility: PUBLIC` to share with others
2. **Direct Usage**: Users can directly reference and use public entities created by others
3. **Ownership Abandonment**: Users can abandon ownership by setting `ownerId` to `null`
4. **Automatic Orphaning**: When users delete their accounts, their entities become orphaned
5. **Cascade Deletion**: Entities only used by the owner are deleted when the owner leaves
6. **Community Management**: Orphaned entities can be managed by moderators and admins

### Visibility Levels

- **PUBLIC**: Visible to all users (including non-authenticated)
- **PRIVATE**: Visible only to owner and administrators
- **HIDDEN**: Visible only to administrators

### Example Scenarios

```typescript
// Scenario 1: Direct Usage
// 1. User A creates public race "Elf"
const elfRace = await raceService.create({
  name: 'Elf',
  description: 'Graceful forest dwellers',
  visibility: 'PUBLIC',
  ownerId: 'user-a-id',
})

// 2. User B creates character using "Elf" race directly
const character = await characterService.create({
  name: 'Legolas',
  raceId: elfRace.id, // Direct reference to User A's race
  ownerId: 'user-b-id',
})

// 3. User A can still modify "Elf" race
// 4. If User A deletes account, "Elf" becomes orphaned (ownerId: null)
// 5. User B's character still works, using the orphaned race

// Scenario 2: User Creates Copy
// User B can also create their own copy if they want independence
const myElfCopy = await raceService.create({
  name: 'High Elf', // Must be unique
  description: 'Tall, elegant elves',
  ownerId: 'user-b-id',
})
```

### Benefits

- ✅ **No Duplicate Content**: Users share actual entities, not copies
- ✅ **Creative Freedom**: Users can create variations when needed
- ✅ **Content Preservation**: Important entities survive creator departure
- ✅ **Simple Logic**: Easy to understand and implement
- ✅ **Flexible Governance**: Moderators can manage orphaned content

## Role-Based Access Control (RBAC)

The API implements a hierarchical permission system with three distinct roles following security
best practices.

### Configuration

```bash
# Environment Configuration
RBAC_ENABLED=true   # Enable RBAC in production
RBAC_ENABLED=false  # Disable for development/testing
```

**Default**: `false` (for backward compatibility with existing tests)

### Role Hierarchy

```text
USER (level 1)
  ↓
MODERATOR (level 2)
  ↓
ADMIN (level 3)
```

### USER Role 👤 (Basic Access)

**Permissions:**

- ✅ View all public entities (`visibility: PUBLIC`) and their own private entities
- ✅ Create new entities with themselves as owner (`ownerId` / `userId`)
- ✅ Update only their own entities
- ✅ Delete only their own entities
- ✅ Use public entities created by others directly (no copying required)
- ✅ Reassign ownership of their entities to other users
- ✅ Abandon ownership by setting `ownerId` to `null` (make entities orphaned)
- ✅ View and update their own profile information
- ✅ Change their own password
- ✅ Delete their own account

**Limitations:**

- ❌ Cannot modify/delete entities owned by others
- ❌ Cannot manage orphaned entities
- ❌ Cannot access private entities of other users
- ❌ Cannot modify other user accounts
- ❌ Cannot access admin functions or statistics

### MODERATOR Role 🛡️ (Content Management)

**Inherits:** All USER permissions

**Additional Permissions:**

- ✅ Edit content of public entities created by USER role accounts (for content moderation)
- ✅ Manage orphaned entities (`ownerId: null`)
- ✅ View all user profiles and activity
- ✅ Access user lists and basic statistics
- ✅ Access to content moderation tools

**Limitations:**

- ❌ Cannot delete entities owned by other users (only edit for moderation)
- ❌ Cannot modify/delete other MODERATOR accounts
- ❌ Cannot modify/delete entities owned by other MODERATORS
- ❌ Cannot modify/delete any ADMIN accounts
- ❌ Cannot modify/delete entities owned by ADMIN accounts
- ❌ Cannot access system administration functions
- ❌ Cannot change user roles or permissions
- ❌ Cannot access sensitive system statistics

### ADMIN Role 👑 (System Administration)

**Inherits:** All USER and MODERATOR permissions

**Additional Permissions:**

- ✅ Create, read, update, delete ANY entity regardless of ownership
- ✅ Manage all USER and MODERATOR accounts and roles
- ✅ Full access to system statistics, logs, and monitoring
- ✅ Bypass all content and ownership restrictions
- ✅ Direct database operations and maintenance
- ✅ Modify system settings and security policies
- ✅ Create/modify/delete USER accounts
- ✅ Create/modify/delete MODERATOR accounts
- ✅ Promote USER to MODERATOR
- ✅ Demote MODERATOR to USER
- ✅ Access all user data and activity logs

**Limitations:**

- ❌ Cannot modify/delete other ADMIN accounts
- ❌ Cannot change other ADMIN roles or permissions
- ❌ Cannot access credentials of other ADMIN accounts

## RBAC Implementation Details

### Service Layer Integration

All services implement RBAC through a centralized `rbacService` located in
`src/shared/rbac.service.ts`:

```typescript
// Example service method with RBAC
export const updateImage = async (
  id: string,
  data: UpdateImageData,
  currentUser: AuthUser | null,
): Promise<Image> => {
  const image = await findImageById(id, currentUser)

  // Check modification permissions
  rbacService.enforcePermission(
    rbacService.canModifyResource(currentUser, image),
    'Insufficient permissions to modify this image',
  )

  // Perform update...
}
```

### Route Protection

Routes are protected using authentication middleware:

```typescript
// Authentication required
fastify.register(async function (fastify) {
  await fastify.register(authenticateUser)

  // Self or admin access
  fastify.get('/users/:id', {
    preHandler: requireSelfOrAdmin('id'),
    handler: userController.getUserById,
  })

  // Role-based access
  fastify.get('/users', {
    preHandler: requireRoles(['MODERATOR', 'ADMIN']),
    handler: userController.getUsersList,
  })
})
```

### Permission Checking Functions

The RBAC service provides granular permission checking:

- `canAccessByVisibility()`: Check access based on resource visibility
- `canModifyResource()`: Check modification permissions
- `canDeleteResource()`: Check deletion permissions
- `canAccessUserProfile()`: Check user profile access
- `canViewStatistics()`: Check statistics access
- `getOwnershipFilter()`: Generate database filters for authorized resources

## Security Measures

### Input Validation & Sanitization

- **TypeBox Schemas**: Comprehensive input validation for all endpoints
- **XSS Prevention**: Proper output encoding and Content Security Policy
- **SQL Injection Prevention**: Parameterized queries with Prisma ORM

### Rate Limiting & Abuse Prevention

- **@fastify/rate-limit**: Configurable rate limiting per endpoint
- **Device Tracking**: Monitor and limit sessions per device
- **Audit Logging**: Track access patterns and security events

### HTTP Security Headers

- **@fastify/helmet**: Automatic security headers
- **CORS Configuration**: Proper cross-origin resource sharing
- **HTTPS Enforcement**: TLS/SSL in production environments

### Session Security

- **Secure Tokens**: Cryptographically secure JWT generation
- **Token Rotation**: Automatic refresh token rotation
- **Session Revocation**: Ability to revoke all user sessions
- **Device Management**: Track and manage user devices

### Data Protection

- **Password Security**: Argon2 hashing with configurable memory cost, time cost, and parallelism
- **Sensitive Data**: Proper handling of PII and credentials
- **Database Security**: Encrypted connections and access controls

## Deployment & Configuration

### Environment Variables

```bash
# Authentication
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# RBAC Control
RBAC_ENABLED=true  # Enable in production
RBAC_ENABLED=false # Disable for testing

# Security
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4
SESSION_SECRET=your-session-secret

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Production Checklist

- ✅ Set `RBAC_ENABLED=true`
- ✅ Configure strong JWT and session secrets
- ✅ Enable HTTPS/TLS encryption
- ✅ Set up proper CORS policies
- ✅ Configure rate limiting
- ✅ Enable audit logging
- ✅ Set up monitoring and alerting
- ✅ Regular security updates

### Monitoring & Alerting

Monitor these security metrics:

- Failed authentication attempts
- Permission denial events
- Unusual access patterns
- Token refresh anomalies
- Admin action logs
- Rate limit violations

## Testing Strategy

### Test Coverage Requirements

**Critical Security Features (Minimum 90% coverage):**

- Authentication services and controllers
- Authorization and RBAC functionality
- Security middleware and validation
- JWT token management
- Password hashing and validation
- Session management
- Security error handling

**General Features (Minimum 80% coverage):**

- Standard CRUD operations
- Non-critical business logic
- Utility functions
- Configuration management

### RBAC Testing

- **Unit Tests**: Test individual permission functions
- **Integration Tests**: Test service-level authorization
- **E2E Tests**: Test complete authentication flows
- **Flag Control**: RBAC can be disabled for legacy tests

### Security Testing

- **Authentication Flows**: Test login, logout, token refresh
- **Authorization**: Test role-based access controls
- **Input Validation**: Test schema validation and sanitization
- **Error Handling**: Test security error responses
