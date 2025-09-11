# Database Migration

Essential patterns for safe database migrations with Prisma in initial API
development.

## Critical Migration Rules

1. **Always use Prisma migrate dev** for schema changes during development
2. **Always make backward-compatible changes** - add, don't drop/rename
3. **Always commit generated migrations** to version control
4. **Never edit generated migration files** - create new ones instead

## Required Migration Workflow

Safe three-phase approach for database changes without breaking production.

```bash
# 1. Create and apply migration
npx prisma migrate dev --name add_user_avatar

# 2. Generate Prisma client
npx prisma generate

# 3. Commit both schema.prisma and migration files
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add user avatar field"
```

## Required Safe Schema Changes

Always use backward-compatible patterns that don't break existing code.

```prisma
// ✅ Safe: Add new optional field
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  avatar    String?  // New optional field - safe
  createdAt DateTime @default(now())
}

// ✅ Safe: Add new table
model Profile {
  id     String @id @default(cuid())
  userId String @unique
  bio    String?
  user   User   @relation(fields: [userId], references: [id])
}

// ❌ Dangerous: Rename or drop fields
// model User {
//   email     String   @unique
//   fullName  String   // Renamed from 'name' - breaks existing code
// }
```

## Required Development Commands

Essential Prisma commands for daily migration work.

```bash
# Create new migration
npx prisma migrate dev --name describe_change

# Reset database (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Generate client after schema changes
npx prisma generate
```

## Required Error Recovery

Handle common migration failures during development.

```bash
# If migration fails to apply
npx prisma migrate reset  # Reset database
npx prisma migrate dev     # Re-apply all migrations

# If schema and database are out of sync
npx prisma db push         # Force sync (development only)
npx prisma generate        # Regenerate client
```
