# Authentication & Security

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
best practices:

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

**Permissions:**

- ✅ All USER permissions (listed above)
- ✅ Edit content of public entities created by USER role accounts (for content moderation)
- ✅ Manage orphaned entities (`ownerId: null`)
- ✅ View all user profiles and activity
- ✅ Ban/unban USER accounts for inappropriate behavior
- ✅ Access to basic moderation tools

**Limitations:**

- ❌ Cannot delete entities owned by other users (only edit for moderation)
- ❌ Cannot modify/delete other MODERATOR accounts
- ❌ Cannot modify/delete entities owned by other MODERATORS
- ❌ Cannot modify/delete any ADMIN accounts
- ❌ Cannot modify/delete entities owned by ADMIN accounts
- ❌ Cannot access system administration functions
- ❌ Cannot change user roles or permissions
- ❌ Cannot access system statistics

### ADMIN Role 👑 (System Administration)

**Inherits:** All USER and MODERATOR permissions

**Permissions:**

- ✅ All USER and MODERATOR permissions (listed above)
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
