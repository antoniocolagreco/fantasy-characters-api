# Fantasy Character API - Technical Documentation

## Project Overview

The **Fantasy Character API** is a comprehensive RESTful API designed for
managing fantasy characters.

---

## Technology Stack

### Backend Core

- **Node.js v24+**: JavaScript runtime powering the backend, chosen for its
  performance and ecosystem
- **TypeScript**: Adds static typing to JavaScript, improving code quality and
  maintainability
- **Fastify v5+**: Web framework for building the API, lightweight and fast with
  built-in schema validation
- **Functional Programming**: Project follows functional programming paradigms,
  avoiding OOP and classes unless absolutely necessary

## Authentication & Security

- **@fastify/jwt**: Official Fastify plugin for JWT token management with native
  integration
- **@fastify/oauth2**: OAuth 2.0 implementation for social login (Google,
  GitHub)
- **@fastify/session**: Session management for OAuth flows and secure user
  sessions
- **@fastify/helmet**: Automatic HTTP security headers
- **@fastify/rate-limit**: Rate limiting to prevent abuse
- **bcrypt**: Industry-standard password hashing with configurable rounds

### Validation & Documentation

- **TypeBox**: Library for defining JSON Schema-compatible schemas with
  TypeScript types
- **Ajv**: High-performance JSON Schema validator for runtime validation
- **@fastify/swagger**: Automatically generates OpenAPI documentation
- **@fastify/swagger-ui**: Interactive Swagger UI for API testing

### Database & ORM

- **Prisma ORM**: Advanced ORM for TypeScript/Node.js with type-safe database
  interactions
- **SQLite**: Default database for local development (file-based)

### Monitoring & Logging

- **Pino**: High-performance JSON logger for Node.js with native Fastify
  integration (currently used only in Fastify core, custom logging utilities
  need integration)
- **@fastify/sensible**: Plugin with utilities and status codes

### Testing & Quality

- **Vitest**: Modern testing framework for unit and integration tests with
  excellent TypeScript support and native ESM support
- **@vitest/ui**: Optional web UI for test visualization and debugging

### Development Tools

- **pnpm**: Fast, disk-efficient package manager for Node.js projects
- **tsx**: TypeScript execution and watch mode for development
- **ESLint**: TypeScript linter with code quality and style rules
- **Prettier**: Opinionated code formatter for consistent style
- **Vitest**: Modern test runner with native TypeScript and ESM support

### CI/CD & Deployment

- **Docker**: Application containerization for consistency across environments
- **Kubernetes**: Container orchestration with health checks and scaling
- **GitHub Actions**: CI/CD pipeline automation
- **Multi-stage Dockerfile**: Optimized container builds for dev/staging/prod
- **Health Checks**: Kubernetes-compatible health monitoring with readiness and
  liveness probes
- **Horizontal Pod Autoscaler**: Automatic scaling based on CPU/memory usage
- **ConfigMaps & Secrets**: Environment-specific configuration management

---

## Directory Structure (Feature-Based)

```text
fantasy-character-api/
├── src/
│   ├── app.ts                # Fastify app setup
│   ├── index.ts              # Application entry point
│   │
│   ├── auth/                 # Authentication feature
│   │   ├── auth.controller.ts
│   │   ├── auth.route.ts
│   │   ├── auth.schema.ts
│   │   ├── auth.service.ts
│   │   └── auth.test.ts
│   │
│   ├── users/                # Users feature
│   │   ├── user.controller.ts
│   │   ├── user.route.ts
│   │   ├── user.schema.ts
│   │   ├── user.service.ts
│   │   └── user.test.ts
│   │
│   ├── characters/           # Characters feature
│   │   ├── character.controller.ts
│   │   ├── character.route.ts
│   │   ├── character.schema.ts
│   │   ├── character.service.ts
│   │   └── character.test.ts
│   │
│   ├── races/                # Races feature
│   │   ├── race.controller.ts
│   │   ├── race.route.ts
│   │   ├── race.schema.ts
│   │   ├── race.service.ts
│   │   └── race.test.ts
│   │
│   ├── archetypes/           # Archetypes feature
│   │   ├── archetype.controller.ts
│   │   ├── archetype.route.ts
│   │   ├── archetype.schema.ts
│   │   ├── archetype.service.ts
│   │   └── archetype.test.ts
│   │
│   ├── skills/               # Skills feature
│   │   ├── skill.controller.ts
│   │   ├── skill.route.ts
│   │   ├── skill.schema.ts
│   │   ├── skill.service.ts
│   │   └── skill.test.ts
│   │
│   ├── perks/                # Perks feature
│   │   ├── perk.controller.ts
│   │   ├── perk.route.ts
│   │   ├── perk.schema.ts
│   │   ├── perk.service.ts
│   │   └── perk.test.ts
│   │
│   ├── items/                # Items feature
│   │   ├── item.controller.ts
│   │   ├── item.route.ts
│   │   ├── item.schema.ts
│   │   ├── item.service.ts
│   │   └── item.test.ts
│   │
│   ├── images/               # Images feature
│   │   ├── image.controller.ts
│   │   ├── image.route.ts
│   │   ├── image.schema.ts
│   │   ├── image.service.ts
│   │   └── image.test.ts
│   │
│   ├── tags/                 # Tags feature
│   │   ├── tag.controller.ts
│   │   ├── tag.route.ts
│   │   ├── tag.schema.ts
│   │   ├── tag.service.ts
│   │   └── tag.test.ts
│   │
│   ├── health/               # Health check feature (Kubernetes-compatible)
│   │   ├── health.controller.ts
│   │   ├── health.route.ts
│   │   └── health.test.ts
│   │
│   └── shared/               # Shared utilities and code
│       ├── config.ts         # Configuration and environment
│       ├── constants.ts      # Application constants and enums
│       ├── errors.ts         # Error classes and handlers
│       ├── middleware.ts     # Shared middleware
│       ├── types.ts          # Shared TypeScript definitions
│       ├── utils.ts          # Shared utility functions
│       └── shared.test.ts    # Tests for shared code
│
├── prisma/                   # Prisma ORM files
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # Database seed script
│   └── migrations/           # Migration files
│
├── k8s/                      # Kubernetes manifests
│   ├── namespace.yaml        # Namespace definition
│   ├── deployment.yaml       # Application deployment
│   ├── service.yaml          # Service definition
│   ├── configmap.yaml        # Configuration management
│   ├── secrets.yaml          # Secrets management
│   ├── ingress.yaml          # Ingress controller
│   └── hpa.yaml              # Horizontal Pod Autoscaler
│
├── .github/                  # GitHub Actions workflows
├── docs/                     # Additional documentation
└── assets/                   # Static assets (images, fonts, etc.)
```

---

## Data Models

### Core Enums

```typescript
enum Role {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

enum Slot {
  NONE = 'none',
  HEAD = 'head',
  CHEST = 'chest',
  LEGS = 'legs',
  FEET = 'feet',
  HANDS = 'hands',
  MAIN_HAND = 'main_hand',
  OFF_HAND = 'off_hand',
  RING = 'ring',
  AMULET = 'amulet',
  BELT = 'belt',
  BACK = 'back',
}
```

### Authentication & Media Models

```typescript
interface User {
    id: string @id @default(uuid())
    email: string @unique
    passwordHash: string
    role: Role @default(USER) // Single role, not array
    isEmailVerified: boolean @default(false)
    isActive: boolean @default(true)
    displayName: string?
    bio: string?
    oauthProvider: string?
    oauthId: string?
    lastPasswordChange: DateTime?
    lastLogin: DateTime @default(now())
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt

    // Profile picture relationship
    profilePictureId: string? @unique
    profilePicture: Image? @relation("UserProfilePicture", fields: [profilePictureId], references: [id], onDelete: Cascade)

    // Relations with CASCADE deletion to prevent orphans
    characters: Character[] @relation("UserCharacters")
    uploadedImages: Image[] @relation("UserImages") // Images uploaded by user
    createdTags: Tag[] @relation("UserTags")
    items: Item[] @relation("UserItems")
    races: Race[] @relation("UserRaces")
    perks: Perk[] @relation("UserPerks")
    skills: Skill[] @relation("UserSkills")
    archetypes: Archetype[] @relation("UserArchetypes")
}

interface Image {
    id: string @id @default(uuid())
    blob: Bytes // Binary data for the image (WebP format, max 350x450px)
    description: string? // Optional description
    filename: string
    size: Int // Size in bytes
    mimeType: string // Always "image/webp" after processing
    width: Int // Image width in pixels (max 350)
    height: Int // Image height in pixels (max 450)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt

    // User who uploaded the image
    uploadedById: string?
    uploadedBy: User? @relation("UserImages", fields: [uploadedById], references: [id], onDelete: Cascade)

    // Profile picture relationship (inverse side)
    userProfile: User? @relation("UserProfilePicture")

    // Content relationships with CASCADE deletion
    characters: Character[] @relation("CharacterImages")
    races: Race[] @relation("RaceImages")
    archetypes: Archetype[] @relation("ArchetypeImages")
    skills: Skill[] @relation("SkillImages")
    items: Item[] @relation("ItemImages")
}
```

### Game System Models

```typescript
interface Tag {
    id: string @id @default(uuid())
    name: string @unique
    description: string?
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt

    // User who created the tag (CASCADE deletion)
    createdById: string?
    createdBy: User? @relation("UserTags", fields: [createdById], references: [id], onDelete: Cascade)

    // Relations
    skills: Skill[] @relation("SkillTags")
    perks: Perk[] @relation("PerkTags")
    races: Race[] @relation("RaceTags")
    archetypes: Archetype[] @relation("ArchetypeTags")
    items: Item[] @relation("ItemTags")
    characters: Character[] @relation("CharacterTags")
}

interface Race {
    id: string @id @default(uuid())
    name: string @unique
    description: string?

    // Attribute modifiers
    healthModifier: Int @default(100)
    manaModifier: Int @default(100)
    staminaModifier: Int @default(100)
    strengthModifier: Int @default(10)
    constitutionModifier: Int @default(10)
    dexterityModifier: Int @default(10)
    intelligenceModifier: Int @default(10)
    wisdomModifier: Int @default(10)
    charismaModifier: Int @default(10)

    // Image with CASCADE deletion
    imageId: string?
    image: Image? @relation("RaceImages", fields: [imageId], references: [id], onDelete: Cascade)

    // User who created the race (CASCADE deletion)
    createdById: string?
    createdBy: User? @relation("UserRaces", fields: [createdById], references: [id], onDelete: Cascade)

    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt

    // Relations
    characters: Character[] @relation("CharacterRaces")
    skills: Skill[] @relation("RaceSkills")
    archetypes: Archetype[] @relation("ArchetypeRequiredRaces")
    tags: Tag[] @relation("RaceTags")
}

interface Archetype {
    id: string @id @default(uuid())
    name: string @unique
    description: string?

    // Image with CASCADE deletion
    imageId: string?
    image: Image? @relation("ArchetypeImages", fields: [imageId], references: [id], onDelete: Cascade)

    // User who created the archetype (CASCADE deletion)
    createdById: string?
    createdBy: User? @relation("UserArchetypes", fields: [createdById], references: [id], onDelete: Cascade)

    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt

    // Relations
    characters: Character[] @relation("CharacterArchetypes")
    skills: Skill[] @relation("ArchetypeSkills")
    requiredRaces: Race[] @relation("ArchetypeRequiredRaces")
    tags: Tag[] @relation("ArchetypeTags")
}

interface Skill {
    id: string @id @default(uuid())
    name: string @unique
    description: string?
    requiredLevel: Int @default(1)

    // Image with CASCADE deletion
    imageId: string?
    image: Image? @relation("SkillImages", fields: [imageId], references: [id], onDelete: Cascade)

    // User who created the skill (CASCADE deletion)
    createdById: string?
    createdBy: User? @relation("UserSkills", fields: [createdById], references: [id], onDelete: Cascade)

    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt

    // Relations
    characters: Character[] @relation("CharacterSkills")
    races: Race[] @relation("RaceSkills")
    archetypes: Archetype[] @relation("ArchetypeSkills")
    items: Item[] @relation("ItemBonusSkills")
    tags: Tag[] @relation("SkillTags")
}

interface Perk {
    id: string @id @default(uuid())
    name: string @unique
    description: string?
    requiredLevel: Int @default(0) // Updated default to 0

    // User who created the perk (CASCADE deletion)
    createdById: string?
    createdBy: User? @relation("UserPerks", fields: [createdById], references: [id], onDelete: Cascade)

    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt

    // Relations
    characters: Character[] @relation("CharacterPerks")
    items: Item[] @relation("ItemBonusPerks")
    tags: Tag[] @relation("PerkTags")
}
```

### Item System Models

```typescript
interface Item {
    id: string @id @default(uuid())
    name: string @unique
    description: string?
    rarity: Rarity @default(COMMON)

    // Attribute bonuses
    bonusHealth: Int?
    bonusMana: Int?
    bonusStamina: Int?
    bonusStrength: Int?
    bonusConstitution: Int?
    bonusDexterity: Int?
    bonusIntelligence: Int?
    bonusWisdom: Int?
    bonusCharisma: Int?

    // Combat stats
    damage: Int? // For weapons
    defense: Int? // For armor

    // Item properties
    requiredLevel: Int @default(1)
    slot: Slot @default(NONE)
    weight: Float @default(1.0)
    value: Int @default(0) // Gold value

    // Item flags
    isArmor: Boolean @default(false)
    isWeapon: Boolean @default(false)
    is2Handed: Boolean @default(false)
    isShield: Boolean @default(false)
    isThrowable: Boolean @default(false)
    isConsumable: Boolean @default(false)
    isQuestItem: Boolean @default(false)
    isTradeable: Boolean @default(true)

    // Durability system
    durability: Int @default(100)
    maxDurability: Int @default(100)

    // Image with CASCADE deletion
    imageId: string?
    image: Image? @relation("ItemImages", fields: [imageId], references: [id], onDelete: Cascade)

    // User who owns/created the item (CASCADE deletion)
    userId: string?
    user: User? @relation("UserItems", fields: [userId], references: [id], onDelete: Cascade)

    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
    isPublic: Boolean @default(true)

    // Relations
    bonusSkills: Skill[] @relation("ItemBonusSkills")
    bonusPerks: Perk[] @relation("ItemBonusPerks")
    tags: Tag[] @relation("ItemTags")

    // Equipment relations
    charactersMainHand: Character[] @relation("CharacterMainHandItem")
    charactersOffHand: Character[] @relation("CharacterOffHandItem")
    charactersHead: Character[] @relation("CharacterHeadItem")
    charactersChest: Character[] @relation("CharacterChestItem")
    charactersLegs: Character[] @relation("CharacterLegsItem")
    charactersFeet: Character[] @relation("CharacterFeetItem")
    charactersHands: Character[] @relation("CharacterHandsItem")
    charactersRing1: Character[] @relation("CharacterRing1Item")
    charactersRing2: Character[] @relation("CharacterRing2Item")
    charactersAmulet: Character[] @relation("CharacterAmuletItem")
    charactersBelt: Character[] @relation("CharacterBeltItem")
    charactersBack: Character[] @relation("CharacterBackItem")

    // Inventory relation
    characterInventories: Character[] @relation("CharacterInventory")
}
```

### Character Model

```typescript
interface Character {
    id: string @id @default(uuid())
    name: string @unique
    description: string?
    level: Int @default(1)
    experience: Int @default(0)

    // Core attributes
    health: Int @default(100)
    mana: Int @default(100)
    stamina: Int @default(100)

    // Primary attributes
    strength: Int @default(10)
    constitution: Int @default(10)
    dexterity: Int @default(10)
    intelligence: Int @default(10)
    wisdom: Int @default(10)
    charisma: Int @default(10)

    // Equipment slots
    mainHandItemId: string?
    mainHandItem: Item? @relation("CharacterMainHandItem", fields: [mainHandItemId], references: [id], onDelete: SetNull)
    offHandItemId: string?
    offHandItem: Item? @relation("CharacterOffHandItem", fields: [offHandItemId], references: [id], onDelete: SetNull)
    headItemId: string?
    headItem: Item? @relation("CharacterHeadItem", fields: [headItemId], references: [id], onDelete: SetNull)
    chestItemId: string?
    chestItem: Item? @relation("CharacterChestItem", fields: [chestItemId], references: [id], onDelete: SetNull)
    legsItemId: string?
    legsItem: Item? @relation("CharacterLegsItem", fields: [legsItemId], references: [id], onDelete: SetNull)
    feetItemId: string?
    feetItem: Item? @relation("CharacterFeetItem", fields: [feetItemId], references: [id], onDelete: SetNull)
    handsItemId: string?
    handsItem: Item? @relation("CharacterHandsItem", fields: [handsItemId], references: [id], onDelete: SetNull)
    ring1ItemId: string?
    ring1Item: Item? @relation("CharacterRing1Item", fields: [ring1ItemId], references: [id], onDelete: SetNull)
    ring2ItemId: string?
    ring2Item: Item? @relation("CharacterRing2Item", fields: [ring2ItemId], references: [id], onDelete: SetNull)
    amuletItemId: string?
    amuletItem: Item? @relation("CharacterAmuletItem", fields: [amuletItemId], references: [id], onDelete: SetNull)
    beltItemId: string?
    beltItem: Item? @relation("CharacterBeltItem", fields: [beltItemId], references: [id], onDelete: SetNull)
    backItemId: string?
    backItem: Item? @relation("CharacterBackItem", fields: [backItemId], references: [id], onDelete: SetNull)

    // Character relations
    raceId: string
    race: Race @relation("CharacterRaces", fields: [raceId], references: [id], onDelete: Restrict)
    archetypeId: string
    archetype: Archetype @relation("CharacterArchetypes", fields: [archetypeId], references: [id], onDelete: Restrict)

    // Many-to-many relations
    skills: Skill[] @relation("CharacterSkills")
    perks: Perk[] @relation("CharacterPerks")
    tags: Tag[] @relation("CharacterTags")
    inventory: Item[] @relation("CharacterInventory")

    // Meta fields
    imageId: string?
    image: Image? @relation("CharacterImages", fields: [imageId], references: [id], onDelete: Cascade)
    userId: string
    user: User @relation("UserCharacters", fields: [userId], references: [id], onDelete: Cascade)
    isPublic: Boolean @default(true)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

---

## Kubernetes Configuration

### Health Check Strategy

The application provides four health endpoints for Kubernetes deployment:

1. **`/api/health`** - Standard health check
2. **`/api/healthz`** - Kubernetes-style health check
3. **`/api/ready`** - Readiness probe (checks if ready to receive traffic)
4. **`/api/live`** - Liveness probe (checks if pod should be restarted)

**Note**: Currently all endpoints use the same controller. For production,
consider implementing different logic for liveness (lightweight) vs readiness
(comprehensive) probes.

### Kubernetes Manifests

Essential files in `k8s/` directory:

- `namespace.yaml` - Creates fantasy-characters namespace
- `deployment.yaml` - Main application deployment with health checks
- `service.yaml` - Service definition for the API
- `configmap.yaml` - Environment configuration
- `secrets.yaml` - Sensitive data (database, JWT secrets)
- `hpa.yaml` - Horizontal Pod Autoscaler (2-10 replicas)
- `ingress.yaml` - External access with SSL/TLS

### Basic Deployment

```bash
# Create secrets (replace with actual values)
kubectl create secret generic fantasy-characters-secrets \
  --from-literal=database-url="your-db-url" \
  --from-literal=jwt-secret="your-jwt-secret" \
  --namespace=fantasy-characters

# Deploy all manifests
kubectl apply -f k8s/

# Check status
kubectl get all -n fantasy-characters
```

### Health Check Configuration

The deployment uses:

- **Liveness Probe**: `/api/live` - Restarts pod if failing
- **Readiness Probe**: `/api/ready` - Stops traffic if failing
- **Startup Probe**: `/api/healthz` - Extra time during startup

---

## API Endpoints

### Authentication Endpoints

```typescript
// User Authentication
POST / api / auth / register // Register new user
POST / api / auth / login // User login
POST / api / auth / logout // User logout
POST / api / auth / refresh // Refresh JWT token

// User Profile
GET / api / auth / profile // Get current user profile
PUT / api / auth / profile // Update user profile
PUT / api / auth / password // Change password
```

### User Management Endpoints

```typescript
// Users CRUD
GET    /api/users                  // List all users with pagination and filtering
GET    /api/users/:id              // Get user by ID with full profile
GET    /api/users/stats            // Get user statistics
POST   /api/users                  // Create new user with validation
PUT    /api/users/:id              // Update user (partial updates supported)
DELETE /api/users/:id              // Delete user (CASCADE deletes related data)

// User Images
GET    /api/images                 // List all images without blob
GET    /api/images/:id             // Get image by ID (metadata only)
GET    /api/images/:id/file        // Get image binary data (WebP format)
GET    /api/images/stats           // Get image statistics
POST   /api/images                 // Upload new image
PUT    /api/images/:id             // Update image
DELETE /api/images/:id             // Delete image
```

### Character Management Endpoints

```typescript
// Characters CRUD
GET    /api/characters             // List characters (with pagination)
GET    /api/characters/:id         // Get character by ID
GET    /api/characters/stats       // Get character statistics
POST   /api/characters             // Create new character
PUT    /api/characters/:id         // Update character
DELETE /api/characters/:id         // Delete character
```

### Game System Endpoints

```typescript
// Races CRUD
GET    /api/races                  // List all races
GET    /api/races/:id              // Get race by ID
GET    /api/races/stats            // Get race statistics
POST   /api/races                  // Create new race (admin)
PUT    /api/races/:id              // Update race (admin)
DELETE /api/races/:id              // Delete race (admin)

// Archetypes CRUD
GET    /api/archetypes             // List all archetypes
GET    /api/archetypes/:id         // Get archetype by ID
GET    /api/archetypes/stats      // Get archetype statistics
POST   /api/archetypes             // Create new archetype (admin)
PUT    /api/archetypes/:id         // Update archetype (admin)
DELETE /api/archetypes/:id         // Delete archetype (admin)

// Skills CRUD
GET    /api/skills                 // List all skills
GET    /api/skills/:id             // Get skill by ID
GET    /api/skills/stats           // Get skill statistics
POST   /api/skills                 // Create new skill (admin)
PUT    /api/skills/:id             // Update skill (admin)
DELETE /api/skills/:id             // Delete skill (admin)

// Perks CRUD
GET    /api/perks                  // List all perks
GET    /api/perks/:id              // Get perk by ID
GET    /api/perks/stats            // Get perk statistics
POST   /api/perks                  // Create new perk (admin)
PUT    /api/perks/:id              // Update perk (admin)
DELETE /api/perks/:id              // Delete perk (admin)
```

### Item Management Endpoints

```typescript
// Items CRUD
GET    /api/items                  // List all items
GET    /api/items/:id              // Get item by ID
GET    /api/items/stats            // Get item statistics
POST   /api/items                  // Create new item (admin)
PUT    /api/items/:id              // Update item (admin)
DELETE /api/items/:id              // Delete item (admin)
```

### Tag Management Endpoints

```typescript
// Tags CRUD
GET    /api/tags                   // List all tags
GET    /api/tags/:id               // Get tag by ID
GET    /api/tags/stats             // Get tag statistics
POST   /api/tags                   // Create new tag
PUT    /api/tags/:id               // Update tag
DELETE /api/tags/:id               // Delete tag
```

### Utility Endpoints

```typescript
// Health Check Endpoints (Kubernetes Compatible)
GET / api / health // Standard health check
GET / api / healthz // Kubernetes-style health check
GET / api / ready // Kubernetes readiness probe
GET / api / live // Kubernetes liveness probe
```

### Image Binary Serving

The API provides a specialized endpoint for serving image binary data:

```typescript
// Binary Image Serving
GET /api/images/:id/file        // Serve image binary data directly
```

**Features:**

- Returns WebP format images (max 350x450px)
- Optimized HTTP caching headers (1-year cache)
- Proper Content-Type and Content-Disposition headers
- No authentication required (public endpoint)
- Efficient binary data streaming

**Response Headers:**

- `Content-Type: image/webp`
- `Cache-Control: public, max-age=31536000`
- `Content-Length: {size in bytes}`
- `Content-Disposition: inline; filename="{original-filename}"`

**Status Codes:**

- `200`: Image served successfully
- `404`: Image not found
- `400`: Invalid UUID format

---

## Development Principles & Functional Programming

### Programming Paradigm: Functional Programming First

This project follows **functional programming principles** and **avoids
object-oriented programming** unless absolutely necessary. Use object-oriented
programming only when it is the most appropriate solution for a specific
problem, such as when working with third-party libraries that require it,.

#### Core Functional Programming Guidelines

1. **No Classes Unless Unavoidable**: Avoid creating classes and object-oriented
   designs. Use functions, modules, and TypeScript types/interfaces instead.

2. **Pure Functions**: Write pure functions without side effects whenever
   possible:

   ```typescript
   // ✅ Good: Pure function
   const calculateUserStats = (characters: Character[]): UserStats => {
     return {
       totalCharacters: characters.length,
       averageLevel: characters.reduce((sum, char) => sum + char.level, 0) / characters.length
     }
   }

   // ❌ Avoid: Class-based approach
   class UserStatsCalculator {
     calculate(characters: Character[]): UserStats { ... }
   }
   ```

3. **Immutability**: Prefer immutable data structures and avoid mutating state:

   ```typescript
   // ✅ Good: Immutable update
   const updateUser = (user: User, updates: Partial<User>): User => ({
     ...user,
     ...updates,
     updatedAt: new Date(),
   })

   // ❌ Avoid: Mutating state
   const updateUserMutable = (user: User, updates: Partial<User>): void => {
     Object.assign(user, updates)
     user.updatedAt = new Date()
   }
   ```

4. **Function Composition**: Use function composition instead of class
   inheritance:

   ```typescript
   // ✅ Good: Function composition
   const validateAndCreateUser = compose(
     createUser,
     validateUserData,
     sanitizeInput
   )

   // ❌ Avoid: Class inheritance
   class ValidatedUserCreator extends UserCreator { ... }
   ```

5. **Higher-Order Functions**: Use map, filter, reduce, and other functional
   array methods:

   ```typescript
   // ✅ Good: Functional approach
   const getActiveUsers = (users: User[]): User[] =>
     users.filter(user => user.isActive)

   const getUserEmails = (users: User[]): string[] =>
     users.map(user => user.email)
   ```

#### Service Layer Pattern (Functional Approach)

Services should be collections of pure functions, not classes:

```typescript
// ✅ Good: Functional service
export const userService = {
  create: (userData: CreateUserData): Promise<User> => { ... },
  findById: (id: string): Promise<User | null> => { ... },
  update: (id: string, updates: Partial<User>): Promise<User> => { ... },
  delete: (id: string): Promise<void> => { ... }
} as const

// ❌ Avoid: Class-based service
export class UserService {
  async create(userData: CreateUserData): Promise<User> { ... }
  async findById(id: string): Promise<User | null> { ... }
}
```

#### Project Principles

- **DRY (Don't Repeat Yourself)**: Avoid duplicating code or logic through
  function composition and reusable utilities
- **KISS (Keep It Simple, Stupid)**: Keep the code as simple as possible,
  favoring readable functional code
- **YAGNI (You Aren't Gonna Need It)**: Don't add functionality until it is
  necessary
- **Fail Fast**: Encourage early failure in development to catch issues sooner
- **Single Responsibility Principle**: Each function should have a single
  responsibility and do it well
- **Separation of Concerns**: Keep different concerns (e.g., validation,
  business logic, data access) in separate modules or functions
- **Avoid Side Effects**: Functions should not have side effects; they should
  return new values without modifying inputs
- **Use TypeScript Types**: Leverage TypeScript's type system to define clear
  interfaces and types for data structures, ensuring type safety and clarity

---

## Development Roadmap

The development is organized into distinct chapters, with each chapter focusing
on a specific feature or set of related features. Each chapter is considered
complete only when all tasks are finished, tests pass, and quality gates are
met.

### Chapter 1: Foundation & Project Setup 🚀

**Feature Focus**: Project structure, configuration, and health endpoint  
**Status**: ✅ COMPLETED  
**Estimated Duration**: 1 week

**Chapter 1 Deliverables:**

- [x] Feature-based project structure established
- [x] TypeScript and ESLint configured with strict rules
- [x] Fastify server with core plugins integrated
- [x] Health check endpoint implemented and tested
- [x] Error handling middleware configured
- [x] Logging system with Pino set up
- [x] Docker development environment working

**Chapter 1 Success Criteria:**

- [x] All health check endpoint tests passing
- [x] Docker container builds and runs successfully
- [x] ESLint returns zero errors and warnings
- [x] Logging captures all requests and errors
- [x] Test coverage >80% for initial setup

### Chapter 2: Database & Persistence Layer 🗄️

**Feature Focus**: Database models and Prisma ORM setup  
**Status**: ✅ COMPLETED  
**Estimated Duration**: 1 week

**Chapter 2 Deliverables:**

- [x] Prisma ORM configured with SQLite for development
- [x] Complete database schema with all models defined
- [x] Initial migrations created and tested
- [x] Database service layer implemented
- [x] Seed data created for development testing

**Chapter 2 Success Criteria:**

- [x] All database models correctly defined with proper relationships
- [x] Migrations run successfully
- [x] Seed data populates development database
- [x] Database service layer tests pass with >80% coverage
- [x] Test coverage >80% for database interactions

### Chapter 3: User Management Feature 👥

**Feature Focus**: User CRUD operations and validation  
**Status**: ✅ COMPLETED  
**Estimated Duration**: 1 week

**Chapter 3 Deliverables:**

- [x] User service with complete business logic
- [x] User validation schemas with TypeBox
- [x] User controller and routes implemented
- [x] Comprehensive test suite for user feature

**Chapter 3 Success Criteria:**

- [x] All user endpoints working as expected
- [x] Input validation handles edge cases correctly
- [x] Database constraints for users enforced
- [x] Test coverage >96% for user feature (exceeded target)

### Chapter 4: Authentication Feature 🔐

**Feature Focus**: User authentication and authorization  
**Status**: ✅ COMPLETED (100%)  
**Estimated Duration**: 2 weeks

**Chapter 4 Deliverables:**

- [x] JWT integration with Fastify (`@fastify/jwt` configured)
- [x] User registration and login flows (fully implemented)
- [x] Token management including refresh tokens (complete database-backed
      implementation)
- [x] Password hashing with bcrypt (12 salt rounds, strong validation)
- [x] Role-based authorization middleware (complete with flexible role checking)
- [x] Complete authentication service layer
- [x] Authentication middleware with optional/required authentication
- [x] Comprehensive input validation with TypeBox schemas
- [x] Profile management endpoints (get/update profile, change password)
- [x] Account management (deactivate/reactivate accounts)
- [x] Integration tests for auth routes (16 comprehensive tests)
- [x] Password strength validation (min 8 chars, letter + number required)
- [x] Email-based registration and login
- [x] JWT token response with user profile data
- [x] Role-based middleware factories (`requireRoles`, `requireAdmin`, etc.)
- [x] Self-or-admin access patterns for resource protection
- [x] Active user and verified email middleware
- [x] Complete authentication routes with Swagger documentation
- [x] Stateless JWT logout (client-side token invalidation)
- [x] Database-backed refresh token system with 7-day expiration
- [x] Unique token generation with crypto.randomUUID()
- [x] Device tracking and token revocation
- [x] Automated token cleanup functionality

**Chapter 4 Success Criteria:**

- [x] Secure authentication workflow ✅
- [x] Password security with proper hashing ✅ (bcrypt with 12 salt rounds)
- [x] Role-based access control working ✅ (comprehensive middleware system)
- [x] Token refresh mechanism functioning ✅ (complete database implementation)
- [x] Test coverage >80% for authentication feature ✅ (95.28% achieved -
      exceeded target)

### Chapter 5: Image Management Feature 🖼️

**Feature Focus**: Image upload, processing, and retrieval  
**Status**: ✅ COMPLETED (100%)  
**Estimated Duration**: 1-2 weeks

**Chapter 5 Deliverables:**

- [x] Image upload endpoint with validation
- [x] WebP conversion pipeline
- [x] Image resizing to 350x450px
- [x] Binary storage in database
- [x] Image metadata retrieval endpoint
- [x] Binary image serving endpoint (GET /api/images/:id/file)
- [x] Authentication and authorization (JWT-based)
- [x] User ownership validation
- [x] Optimized HTTP caching headers for binary content

**Chapter 5 Success Criteria:**

- [x] Images properly resized and converted to WebP format
- [x] Upload validation works for different file types
- [x] Image retrieval is performant with proper caching
- [x] Binary image serving with optimized headers (1-year cache)
- [x] Edge cases handled (large files, invalid formats)
- [x] Test coverage >80% for image feature (achieved 46/46 tests passing)

### Chapter 6: Tags Feature 🏷️

**Feature Focus**: Tag system for categorization  
**Status**: ❌ NOT STARTED  
**Estimated Duration**: 1 week

**Chapter 6 Deliverables:**

- [ ] Tags service with CRUD operations
- [ ] Tag validation and uniqueness constraints
- [ ] Tag controller and routes
- [ ] Relationship management with other entities

**Chapter 6 Success Criteria:**

- [ ] Tag creation and association working
- [ ] Validation prevents duplicate tags
- [ ] Relationship management works correctly
- [ ] Tests cover all tag operations
- [ ] Test coverage >80% for tags feature

### Chapter 7: Skills Feature ⚡

**Feature Focus**: Character skills and abilities  
**Status**: ❌ NOT STARTED  
**Estimated Duration**: 1 week

**Chapter 7 Deliverables:**

- [ ] Skills service with level requirements
- [ ] Skill validation and constraints
- [ ] Skill controller and routes
- [ ] Image association for skills

**Chapter 7 Success Criteria:**

- [ ] Skill creation with level requirements
- [ ] Validation rules for prerequisites
- [ ] Image association working
- [ ] Tests cover all skill operations
- [ ] Test coverage >80% for skills feature

### Chapter 8: Perks Feature 🌟

**Feature Focus**: Character perks and bonuses  
**Status**: ❌ NOT STARTED  
**Estimated Duration**: 1 week

**Chapter 8 Deliverables:**

- [ ] Perks service with CRUD operations
- [ ] Perk validation and level requirements
- [ ] Perk controller and routes
- [ ] Relationship management

**Chapter 8 Success Criteria:**

- [ ] Perk creation with requirements
- [ ] Validation rules enforced
- [ ] Relationship management working
- [ ] Admin-only endpoints secured
- [ ] Tests cover all perk operations

### Chapter 9: Races Feature 🧝

**Feature Focus**: Fantasy races implementation  
**Status**: ❌ NOT STARTED  
**Estimated Duration**: 1 week

**Chapter 9 Deliverables:**

- [ ] Races service with attribute modifiers
- [ ] Race validation and constraints
- [ ] Race controller and routes
- [ ] Image association for races

**Chapter 9 Success Criteria:**

- [ ] Race creation with attribute modifiers
- [ ] Image association working
- [ ] Race relationships with other entities
- [ ] Admin-only access controls working
- [ ] Test coverage >80% for races feature

### Chapter 10: Archetypes Feature 🛡️

**Feature Focus**: Character class/archetype system  
**Status**: ❌ NOT STARTED  
**Estimated Duration**: 1 week

**Chapter 10 Deliverables:**

- [ ] Archetypes service with full CRUD
- [ ] Archetype-race compatibility rules
- [ ] Archetype controller and routes
- [ ] Required race validation

**Chapter 10 Success Criteria:**

- [ ] Archetype creation with race requirements
- [ ] Validation rules enforced
- [ ] Relationship management working
- [ ] Admin-only endpoints secured
- [ ] Test coverage >80% for archetypes feature

### Chapter 11: Items Feature ⚔️

**Feature Focus**: Equipment and inventory system  
**Status**: ❌ NOT STARTED  
**Estimated Duration**: 2 weeks

**Chapter 11 Deliverables:**

- [ ] Items service with properties and types
- [ ] Equipment slot validation
- [ ] Item rarity and bonus attributes
- [ ] Item controller and routes
- [ ] Image association for items

**Chapter 11 Success Criteria:**

- [ ] Item creation with all properties
- [ ] Equipment slot validation
- [ ] Bonus attributes calculation
- [ ] Image association working
- [ ] Test coverage >80% for items feature

### Chapter 12: Characters Feature 👤

**Feature Focus**: Complete character system  
**Status**: ❌ NOT STARTED  
**Estimated Duration**: 2-3 weeks

**Chapter 12 Deliverables:**

- [ ] Character service with all attributes
- [ ] Race and archetype selection
- [ ] Equipment and inventory management
- [ ] Skills and perks assignment
- [ ] Character controller and routes
- [ ] Image association for characters

**Chapter 12 Success Criteria:**

- [ ] Character creation with race/archetype
- [ ] Equipment management working
- [ ] Inventory system functioning
- [ ] Attribute calculation based on gear/race
- [ ] All relationships properly managed
- [ ] Test coverage >80% for characters feature

### Chapter 13: Performance & Security Hardening 🛠️

**Feature Focus**: Optimization and security  
**Status**: ❌ NOT STARTED  
**Estimated Duration**: 1 week

**Chapter 13 Deliverables:**

- [ ] Performance optimizations implemented
- [ ] Complete API documentation
- [ ] Security headers and protections
- [ ] Final testing and bug fixes

**Chapter 13 Success Criteria:**

- [ ] Response times under 200ms for all endpoints
- [ ] Zero security vulnerabilities
- [ ] Complete documentation
- [ ] All tests passing with >80% coverage

---

## Testing Strategy

### Feature-Based Testing Approach

Each feature directory contains its own tests subdirectory with:

1. **Unit Tests**: Testing isolated functions and services
2. **Integration Tests**: Testing feature endpoints and controllers
3. **E2E Tests**: Testing complete feature workflows

### Testing Principles

- **Test-Driven Development**: Write tests first when possible
- **High Coverage**: Aim for >80% test coverage
- **Realistic Test Data**: Use representative test data
- **Isolated Tests**: Tests should not depend on external systems
- **Fast Execution**: Tests should run quickly for developer feedback

---

## Development & Quality Standards

### TDD Workflow (Per Feature)

1. **Write Tests First**: Unit tests for service layer
2. **Implement Service**: Business logic and data access
3. **Create Controller**: HTTP request/response handling
4. **Define Routes**: Endpoint implementation
5. **Register Routes**: Add to Fastify
6. **Integration Tests**: End-to-end testing
7. **Refactor & Optimize**: Code improvement

### Quality Gates

- **Unit Test Coverage**: >80% for each feature
- **Integration Tests**: All endpoints tested
- **Code Review**: Peer review required
- **Performance Testing**: Response time < 200ms
- **Security Scan**: Automated vulnerability checks

### Deployment Strategy

#### Local Development

- **Docker Compose**: Multi-container setup with database
- **Hot Reload**: Live code reloading with tsx
- **Development Database**: SQLite for rapid iteration

#### Staging/Production Deployment

- **Kubernetes**: Container orchestration with auto-scaling
- **Continuous Integration**: Automated testing on pull requests
- **Continuous Deployment**: Automated deployment to staging
- **Production Release**: Manual promotion from staging with approval gates
- **Blue-Green Deployment**: Zero-downtime deployments
- **Rollback Ready**: Quick rollback capability using Kubernetes
- **Health Monitoring**: Comprehensive health checks and alerts
- **Log Aggregation**: Centralized logging with structured JSON logs
- **Metrics Collection**: Prometheus metrics and Grafana dashboards

#### Database Strategy

- **Development**: SQLite (file-based)
- **Staging/Production**: PostgreSQL or MySQL with persistent volumes
- **Migration Strategy**: Automated database migrations in init containers
- **Backup Strategy**: Regular automated backups with point-in-time recovery
