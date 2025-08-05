# Fantasy Character API - Technical Documentation

## Project Overview

The **Fantasy Character API** is a comprehensive RESTful API designed for managing fantasy characters.

---

## Technology Stack

### Backend Core

- **Node.js v24+**: JavaScript runtime powering the backend, chosen for its performance and ecosystem
- **TypeScript**: Adds static typing to JavaScript, improving code quality and maintainability
- **Fastify v5+**: Web framework for building the API, lightweight and fast with built-in schema validation

## Authentication & Security

- **@fastify/jwt**: Official Fastify plugin for JWT token management with native integration
- **@fastify/oauth2**: OAuth 2.0 implementation for social login (Google, GitHub)
- **@fastify/session**: Session management for OAuth flows and secure user sessions
- **@fastify/helmet**: Automatic HTTP security headers
- **@fastify/rate-limit**: Rate limiting to prevent abuse
- **bcrypt**: Industry-standard password hashing with configurable rounds

### Validation & Documentation

- **TypeBox**: Library for defining JSON Schema-compatible schemas with TypeScript types
- **Ajv**: High-performance JSON Schema validator for runtime validation
- **@fastify/swagger**: Automatically generates OpenAPI documentation
- **@fastify/swagger-ui**: Interactive Swagger UI for API testing

### Database & ORM

- **Prisma ORM**: Advanced ORM for TypeScript/Node.js with type-safe database interactions
- **SQLite**: Default database for local development (file-based)

### Monitoring & Logging

- **Pino**: High-performance JSON logger for Node.js with native Fastify integration
- **@fastify/sensible**: Plugin with utilities and status codes

### Testing & Quality

- **Jest**: Testing framework for unit and integration tests with excellent TypeScript support
- **supertest**: HTTP assertion testing for integration tests
- **@types/jest**: TypeScript definitions for Jest

### Development Tools

- **pnpm**: Fast, disk-efficient package manager for Node.js projects
- **tsx**: TypeScript execution and watch mode for development
- **ESLint**: TypeScript linter with code quality and style rules
- **Prettier**: Opinionated code formatter for consistent style

### CI/CD & Deployment

- **Docker**: Application containerization for consistency across environments
- **GitHub Actions**: CI/CD pipeline automation
- **Multi-stage Dockerfile**: Optimized container builds for dev/staging/prod
- **Health Checks**: Container and application health monitoring

---

## Data Models

### Core Enums

```typescript
enum Role {
    USER = "user",
    ADMIN = "admin",
    MODERATOR = "moderator"
}

enum Rarity {
    COMMON = "common",
    UNCOMMON = "uncommon",
    RARE = "rare",
    EPIC = "epic",
    LEGENDARY = "legendary"
}

enum Slot {
    NONE = "none",
    HEAD = "head",
    CHEST = "chest",
    LEGS = "legs",
    FEET = "feet",
    HANDS = "hands",
    MAIN_HAND = "main_hand",
    OFF_HAND = "off_hand",
    RING = "ring",
    AMULET = "amulet",
    BELT = "belt",
    BACK = "back"
}
```

### Authentication & Media Models

```typescript
interface User {
    id: string @id @default(uuid())
    email: string @unique
    passwordHash: string
    displayName: string?
    roles: Role[] @default([Role.USER])
    lastLogin: DateTime @default(now())
    oauthProvider: string?
    oauthId: string?
    profilePictureId: string?
    profilePicture: Image? @relation("UserProfilePicture", fields: [profilePictureId], references: [id])
    bio: string?
    isEmailVerified: boolean @default(false)
    isActive: boolean @default(true)
    lastPasswordChange: DateTime?
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
    
    // Relations
    characters: Character[] @relation("UserCharacters")
    images: Image[] @relation("UserImages")
}

interface Image {
    id: string @id @default(uuid())
    blob: Bytes // Binary data for the image
    filename: string
    size: Int // Size in bytes
    mimeType: string // e.g., "image/png", "image/jpeg"
    width: Int // Image width in pixels
    height: Int // Image height in pixels
    userId: string
    user: User @relation("UserImages", fields: [userId], references: [id])
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
    
    // Relations
    userProfile: User? @relation("UserProfilePicture")
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
    createdById: string?
    createdBy: User? @relation("UserCreatedTags", fields: [createdById], references: [id])

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
    description: string
    
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

    // Image
    imageId: string?
    image: Image? @relation("RaceImages", fields: [imageId], references: [id])

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
    description: string
    
    // Image
    imageId: string?
    image: Image? @relation("ArchetypeImages", fields: [imageId], references: [id])
    
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
    description: string
    requiredLevel: Int @default(1)
    
    // Image
    imageId: string?
    image: Image? @relation("SkillImages", fields: [imageId], references: [id])
    
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
    description: string
    requiredLevel: Int @default(1)
    
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
    description: string
    type: string // "weapon", "armor", "consumable", etc.
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
    
    // Image
    imageId: string?
    image: Image? @relation("ItemImages", fields: [imageId], references: [id])
    
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
    
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
    maxHealth: Int @default(100)
    mana: Int @default(100)
    maxMana: Int @default(100)
    stamina: Int @default(100)
    maxStamina: Int @default(100)
    
    // Primary attributes
    strength: Int @default(10)
    constitution: Int @default(10)
    dexterity: Int @default(10)
    intelligence: Int @default(10)
    wisdom: Int @default(10)
    charisma: Int @default(10)
    
    // Equipment slots
    mainHandItemId: string?
    mainHandItem: Item? @relation("CharacterMainHandItem", fields: [mainHandItemId], references: [id])
    offHandItemId: string?
    offHandItem: Item? @relation("CharacterOffHandItem", fields: [offHandItemId], references: [id])
    headItemId: string?
    headItem: Item? @relation("CharacterHeadItem", fields: [headItemId], references: [id])
    chestItemId: string?
    chestItem: Item? @relation("CharacterChestItem", fields: [chestItemId], references: [id])
    legsItemId: string?
    legsItem: Item? @relation("CharacterLegsItem", fields: [legsItemId], references: [id])
    feetItemId: string?
    feetItem: Item? @relation("CharacterFeetItem", fields: [feetItemId], references: [id])
    handsItemId: string?
    handsItem: Item? @relation("CharacterHandsItem", fields: [handsItemId], references: [id])
    ring1ItemId: string?
    ring1Item: Item? @relation("CharacterRing1Item", fields: [ring1ItemId], references: [id])
    ring2ItemId: string?
    ring2Item: Item? @relation("CharacterRing2Item", fields: [ring2ItemId], references: [id])
    amuletItemId: string?
    amuletItem: Item? @relation("CharacterAmuletItem", fields: [amuletItemId], references: [id])
    beltItemId: string?
    beltItem: Item? @relation("CharacterBeltItem", fields: [beltItemId], references: [id])
    backItemId: string?
    backItem: Item? @relation("CharacterBackItem", fields: [backItemId], references: [id])
    
    // Character relations
    raceId: string
    race: Race @relation("CharacterRaces", fields: [raceId], references: [id])
    archetypeId: string
    archetype: Archetype @relation("CharacterArchetypes", fields: [archetypeId], references: [id])
    
    // Many-to-many relations
    skills: Skill[] @relation("CharacterSkills")
    perks: Perk[] @relation("CharacterPerks")
    tags: Tag[] @relation("CharacterTags")
    inventory: Item[] @relation("CharacterInventory")
    
    // Meta fields
    imageId: string?
    image: Image? @relation("CharacterImages", fields: [imageId], references: [id])
    userId: string
    user: User @relation("UserCharacters", fields: [userId], references: [id])
    isPublic: Boolean @default(true)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

---

## API Endpoints

### Authentication Endpoints

```typescript
// User Authentication
POST   /api/auth/register          // Register new user
POST   /api/auth/login             // User login
POST   /api/auth/logout            // User logout
POST   /api/auth/refresh           // Refresh JWT token

// User Profile
GET    /api/auth/profile           // Get current user profile
PUT    /api/auth/profile           // Update user profile
PUT    /api/auth/password          // Change password
```

### User Management Endpoints

```typescript
// Users CRUD (Admin only)
GET    /api/users                  // List all users (admin)
GET    /api/users/:id              // Get user by ID (admin/owner)
PUT    /api/users/:id              // Update user (admin/owner)
DELETE /api/users/:id              // Delete user (admin)

// User Images
POST   /api/images                 // Upload new image
GET    /api/images/:id             // Get image by ID
DELETE /api/images/:id             // Delete image
```

### Character Management Endpoints

```typescript
// Characters CRUD
GET    /api/characters             // List characters (with pagination)
GET    /api/characters/:id         // Get character by ID
POST   /api/characters             // Create new character
PUT    /api/characters/:id         // Update character
DELETE /api/characters/:id         // Delete character
```

### Game System Endpoints

```typescript
// Races CRUD
GET    /api/races                  // List all races
GET    /api/races/:id              // Get race by ID
POST   /api/races                  // Create new race (admin)
PUT    /api/races/:id              // Update race (admin)
DELETE /api/races/:id              // Delete race (admin)

// Archetypes CRUD
GET    /api/archetypes             // List all archetypes
GET    /api/archetypes/:id         // Get archetype by ID
POST   /api/archetypes             // Create new archetype (admin)
PUT    /api/archetypes/:id         // Update archetype (admin)
DELETE /api/archetypes/:id         // Delete archetype (admin)

// Skills CRUD
GET    /api/skills                 // List all skills
GET    /api/skills/:id             // Get skill by ID
POST   /api/skills                 // Create new skill (admin)
PUT    /api/skills/:id             // Update skill (admin)
DELETE /api/skills/:id             // Delete skill (admin)

// Perks CRUD
GET    /api/perks                  // List all perks
GET    /api/perks/:id              // Get perk by ID
POST   /api/perks                  // Create new perk (admin)
PUT    /api/perks/:id              // Update perk (admin)
DELETE /api/perks/:id              // Delete perk (admin)
```

### Item Management Endpoints

```typescript
// Items CRUD
GET    /api/items                  // List all items
GET    /api/items/:id              // Get item by ID
POST   /api/items                  // Create new item (admin)
PUT    /api/items/:id              // Update item (admin)
DELETE /api/items/:id              // Delete item (admin)
```

### Tag Management Endpoints

```typescript
// Tags CRUD
GET    /api/tags                   // List all tags
GET    /api/tags/:id               // Get tag by ID
POST   /api/tags                   // Create new tag
PUT    /api/tags/:id               // Update tag
DELETE /api/tags/:id               // Delete tag
```

### Utility Endpoints

```typescript
// Search
GET    /api/search?q=:query&type=:type  // Global search with filters

// Health Check
GET    /api/health                 // API health status
```

---

## Development Roadmap - Agile Chapters

### Chapter 1: Foundation & Deployment Infrastructure 🚀

**Goal**: Deployable foundation with everything needed for production deployment
**Duration**: 1 week
**Status**: ✅ COMPLETE

#### Project Deliverables

- [x] **Project Initialization**: Package.json, TypeScript config, folder structure
- [x] **Fastify Setup**: Basic server with TypeScript integration
- [x] **Health Check Endpoint**: `/api/health` with server status
- [x] **Docker Configuration**: Multi-stage Dockerfile for dev/prod
- [x] **Environment Configuration**: Environment variables management
- [ ] **CI/CD Pipeline**: GitHub Actions for build, test, deploy (workflow disabled)
- [x] **Production Deployment**: Container ready for deployment

#### Endpoints Implemented

```typescript
GET    /api/health                 // Health check with system status
```

#### Technical Stack Setup

- Fastify server initialization
- TypeScript strict configuration
- Docker development and production containers
- Environment variables validation
- Basic error handling structure
- GitHub Actions workflow

---

### Chapter 2: Database Foundation & Models 🗄️

**Goal**: Database schema and Prisma setup
**Duration**: 1 week
**Status**: ❌ NOT STARTED

#### Database Deliverables

- [ ] **Prisma Schema**: Complete database models
- [ ] **Database Migrations**: Initial schema migration
- [ ] **Seed Data**: Basic test data for development
- [ ] **Database Services**: CRUD operations layer
- [ ] **Connection Testing**: Database health checks

#### Database Models Implemented

- [ ] All models from the schema (User, Character, Race, etc.)
- [ ] Proper relationships and constraints
- [ ] Migration scripts
- [ ] Seed data for testing

---

### Chapter 3: Shared Infrastructure & Error Management 🔧

**Goal**: Centralized error handling, logging, and shared utilities
**Duration**: 1 week
**Status**: 🟡 PARTIAL

#### Infrastructure Deliverables

- [x] **Centralized Error Handling**: Global error handler with typed errors
- [ ] **Custom Error Classes**: Business logic and validation errors
- [x] **Logging System**: Structured logging with Pino
- [ ] **Validation Schemas**: TypeBox schemas for request validation
- [ ] **Response Formatters**: Standardized API response format
- [ ] **Shared Utilities**: Common functions and helpers

#### Infrastructure Components

- [x] Global error handler middleware
- [ ] Custom error classes (ValidationError, NotFoundError, etc.)
- [x] Structured logging with request tracking
- [ ] TypeBox validation schemas
- [ ] Standard API response format
- [ ] Utility functions and helpers

---

### Chapter 4: User Management System 👥

**Goal**: User profiles (no authentication yet)
**Duration**: 1 week
**Status**: ❌ NOT STARTED

#### User TDD Implementation

- [ ] User profile management
- [ ] Simple user creation/editing
- [ ] User data validation

#### User Endpoints

```typescript
GET    /api/users                  // List users
GET    /api/users/:id              // Get user profile
POST   /api/users                  // Create user (simple)
PUT    /api/users/:id              // Update user
DELETE /api/users/:id              // Delete user
```

---

### Chapter 5: Image Management System 🖼️

**Goal**: File upload and image handling
**Duration**: 1-2 weeks
**Status**: ❌ NOT STARTED

#### Image TDD Implementation

- [ ] File upload validation
- [ ] Image processing and optimization
- [ ] Storage management
- [ ] Security validation

#### Image Endpoints

```typescript
POST   /api/images                 // Upload image
GET    /api/images/:id             // Get image
DELETE /api/images/:id             // Delete image
```

---

### Chapter 6: Tags CRUD - Categorization System 🏷️

**Goal**: Tag management for content categorization
**Duration**: 1 week
**Status**: ❌ NOT STARTED

#### Tags TDD Implementation

- [ ] Tag creation and management
- [ ] Tag validation and uniqueness
- [ ] Tag relationships

#### Tags Endpoints

```typescript
GET    /api/tags                   // List all tags
GET    /api/tags/:id               // Get tag by ID
POST   /api/tags                   // Create new tag
PUT    /api/tags/:id               // Update tag
DELETE /api/tags/:id               // Delete tag
```

---

### Chapter 7: Skills CRUD - Abilities System 🎯

**Goal**: Skill management with TDD
**Duration**: 1 week
**Status**: ❌ NOT STARTED

#### Skills TDD Implementation

- [ ] Skills business logic and validation
- [ ] Level requirements validation
- [ ] Skill prerequisites handling

#### Skills Endpoints

```typescript
GET    /api/skills                 // List all skills
GET    /api/skills/:id             // Get skill by ID
POST   /api/skills                 // Create skill
PUT    /api/skills/:id             // Update skill
DELETE /api/skills/:id             // Delete skill
```

---

### Chapter 8: Perks CRUD - Character Benefits 🌟

**Goal**: Perk management system
**Duration**: 1 week
**Status**: ❌ NOT STARTED

#### Perks TDD Implementation

- [ ] Perk creation and validation
- [ ] Level requirements
- [ ] Perk effects and bonuses

#### Perks Endpoints

```typescript
GET    /api/perks                  // List all perks
GET    /api/perks/:id              // Get perk by ID
POST   /api/perks                  // Create new perk
PUT    /api/perks/:id              // Update perk
DELETE /api/perks/:id              // Delete perk
```

---

### Chapter 9: Races CRUD - Game System Foundation 🧝

**Goal**: Race management following TDD pattern
**Duration**: 1 week
**Status**: ❌ NOT STARTED

#### Races TDD Implementation

- [ ] Race-specific business logic
- [ ] Validation for race attributes and modifiers
- [ ] Race-archetype compatibility

#### Races Endpoints

```typescript
GET    /api/races                  // List all races
GET    /api/races/:id              // Get race by ID
POST   /api/races                  // Create race
PUT    /api/races/:id              // Update race
DELETE /api/races/:id              // Delete race
```

---

### Chapter 10: Archetypes CRUD - Character Classes 🛡️

**Goal**: Archetype system implementation
**Duration**: 1 week
**Status**: ❌ NOT STARTED

#### Archetypes TDD Implementation

- [ ] Archetype abilities and restrictions
- [ ] Race requirements validation
- [ ] Archetype-specific skills

#### Archetypes Endpoints

```typescript
GET    /api/archetypes             // List all archetypes
GET    /api/archetypes/:id         // Get archetype by ID
POST   /api/archetypes             // Create archetype
PUT    /api/archetypes/:id         // Update archetype
DELETE /api/archetypes/:id         // Delete archetype
```

---

### Chapter 11: Items CRUD - Equipment System ⚔️

**Goal**: Item management with complex validation
**Duration**: 1-2 weeks
**Status**: ❌ NOT STARTED

#### Items TDD Implementation

- [ ] Item types and rarity validation
- [ ] Equipment slot validation
- [ ] Bonus stats calculation
- [ ] Durability system

#### Items Endpoints

```typescript
GET    /api/items                  // List all items with filters
GET    /api/items/:id              // Get item by ID
POST   /api/items                  // Create item
PUT    /api/items/:id              // Update item
DELETE /api/items/:id              // Delete item
```

---

### Chapter 12: Characters CRUD - Complex Core Endpoint 👤

**Goal**: Complete Character management with all dependencies
**Duration**: 2-3 weeks
**Status**: ❌ NOT STARTED

#### Characters TDD Development Process

1. **Tests First**: Unit and integration tests
2. **Service Layer**: Business logic and data access
3. **Controller Layer**: Request/response handling
4. **Route Definition**: Endpoint implementation
5. **Route Registration**: Add to Fastify instance

#### Characters Dependencies Required

- [ ] Users (for character ownership)
- [ ] Images (for character portraits)
- [ ] Tags (for character categorization)
- [ ] Skills (for character abilities)
- [ ] Perks (for character benefits)
- [ ] Races (for character creation)
- [ ] Archetypes (for character creation)
- [ ] Items (for equipment and inventory)

#### Characters Project Deliverables

- [ ] **Character Service**: CRUD with complex business logic
- [ ] **Character Controller**: HTTP request handling
- [ ] **Character Routes**: All CRUD endpoints
- [ ] **Equipment Management**: Equip/unequip items
- [ ] **Inventory System**: Add/remove items from inventory
- [ ] **Stat Calculation**: Calculate stats from race/archetype/equipment
- [ ] **Validation Schemas**: Complex input/output validation
- [ ] **Unit Tests**: Service layer testing (>90% coverage)
- [ ] **Integration Tests**: End-to-end API testing

#### Characters Endpoints

```typescript
// Basic CRUD
GET    /api/characters             // List characters with pagination
GET    /api/characters/:id         // Get character by ID
POST   /api/characters             // Create new character
PUT    /api/characters/:id         // Update character
DELETE /api/characters/:id         // Delete character

// Equipment Management
PUT    /api/characters/:id/equipment // Update equipment slots
POST   /api/characters/:id/equip   // Equip item to specific slot
POST   /api/characters/:id/unequip // Unequip item from slot

// Inventory Management
GET    /api/characters/:id/inventory // Get character inventory
PUT    /api/characters/:id/inventory // Update inventory
POST   /api/characters/:id/inventory // Add item to inventory
DELETE /api/characters/:id/inventory/:itemId // Remove item

// Skills & Perks
GET    /api/characters/:id/skills  // Get character skills
PUT    /api/characters/:id/skills  // Update character skills
GET    /api/characters/:id/perks   // Get character perks
PUT    /api/characters/:id/perks   // Update character perks

// Character Progression
POST   /api/characters/:id/level-up // Level up character
PUT    /api/characters/:id/stats   // Update character stats
```

#### Characters Complex Business Logic

- [ ] Character creation validation (race + archetype compatibility)
- [ ] Equipment slot validation and restrictions
- [ ] Stat calculation from base + race modifiers + equipment bonuses
- [ ] Level requirements for skills and perks
- [ ] Item requirements and restrictions
- [ ] Inventory weight and capacity management

---

### Chapter 13: Search & Utility Endpoints 🔍

**Goal**: Global search and utility functions
**Duration**: 1 week
**Status**: ❌ NOT STARTED

#### Search TDD Implementation

- [ ] Search functionality across entities
- [ ] Filtering and pagination
- [ ] Performance optimization

#### Search Endpoints

```typescript
GET    /api/search                 // Global search with filters
```

---

### Chapter 14: Security Hardening 🔒

**Goal**: Security headers, rate limiting, input sanitization
**Duration**: 1 week
**Status**: 🟡 PARTIAL

#### Security Project Deliverables

- [x] **Helmet Integration**: Security headers
- [x] **Rate Limiting**: Request throttling
- [ ] **Input Sanitization**: XSS and injection prevention
- [ ] **CORS Configuration**: Cross-origin request handling
- [ ] **Security Testing**: Vulnerability assessment

---

### Chapter 15: Authentication System 🔐

**Goal**: JWT authentication and session management
**Duration**: 2 weeks
**Status**: ❌ NOT STARTED

#### Auth TDD Implementation

- [ ] User registration and login
- [ ] JWT token management
- [ ] Password hashing with bcrypt
- [ ] Session management

#### Auth Endpoints

```typescript
POST   /api/auth/register          // User registration
POST   /api/auth/login             // User login
POST   /api/auth/logout            // User logout
POST   /api/auth/refresh           // Refresh token
GET    /api/auth/profile           // Get current user profile
PUT    /api/auth/profile           // Update profile
PUT    /api/auth/password          // Change password
```

---

### Chapter 16: Authorization & Role Management 👑

**Goal**: Role-based access control and permissions
**Duration**: 1-2 weeks
**Status**: ❌ NOT STARTED

#### Authorization TDD Implementation

- [ ] Role-based middleware
- [ ] Permission system
- [ ] Admin endpoint protection
- [ ] User ownership validation

#### Authorization Features

- [ ] USER, ADMIN, MODERATOR roles
- [ ] Endpoint-level permissions
- [ ] Resource ownership checks
- [ ] Admin panel access control

---

### Chapter 17: OAuth Integration 🌐

**Goal**: Social login with Google and GitHub
**Duration**: 1-2 weeks
**Status**: ❌ NOT STARTED

#### OAuth TDD Implementation

- [ ] OAuth 2.0 flow implementation
- [ ] Provider integration
- [ ] Account linking
- [ ] Fallback authentication

#### OAuth Endpoints

```typescript
GET    /api/auth/google            // Google OAuth
GET    /api/auth/github            // GitHub OAuth
GET    /api/auth/callback/:provider // OAuth callback
```

---

## Development Principles

### TDD Workflow (Per Chapter)

1. **Write Tests First**: Unit tests for service layer
2. **Implement Service**: Business logic and data access
3. **Create Controller**: HTTP request/response handling
4. **Define Routes**: Endpoint implementation
5. **Register Routes**: Add to Fastify
6. **Integration Tests**: End-to-end testing
7. **Refactor & Optimize**: Code improvement

### Quality Gates

- [ ] **Unit Test Coverage**: >90% for each chapter
- [ ] **Integration Tests**: All endpoints tested
- [ ] **Code Review**: Peer review required
- [ ] **Performance Testing**: Response time < 200ms
- [ ] **Security Scan**: Automated vulnerability checks

### Deployment Strategy

- [ ] **Every Chapter**: Auto-deploy to staging
- [ ] **Production Release**: After integration testing
- [ ] **Rollback Ready**: Quick rollback capability
- [ ] **Monitoring**: Health checks and alerts

This approach ensures:

1. ✅ **Immediate Deployment**: Chapter 1 is production-ready
2. ❌ **Database Foundation**: Chapter 2 provides complete data models
3. 🟡 **Solid Infrastructure**: Chapter 3 provides robust error handling
4. ❌ **TDD Throughout**: Every endpoint built test-first
5. ❌ **Incremental Value**: Each chapter adds working features
6. ❌ **Security Last**: Authentication when everything else works
7. ✅ **Manageable Scope**: Each chapter is 1-2 weeks max
