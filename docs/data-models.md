# Fantasy Characters API - Data Models

This document outlines the data models for the Fantasy Characters API using
Prisma schema format.

## Database Configuration

```prisma
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}
```

### UUIDv7 strategy (recommended)

Why UUIDv7:

- Time-ordered (monotonic) IDs improve index locality and cursor pagination
  stability
- Still globally unique without coordination

Options:

1. Application-generated (portable)

```ts
// install: pnpm add uuidv7
import { uuidv7 } from 'uuidv7'

const id = uuidv7()
await prisma.character.create({ data: { id, name: 'Aria' /* ... */ } })
```

1. Database-generated (PostgreSQL)

Requires a function like `uuid_generate_v7()` (via an extension such as
pg_uuidv7). Then set Prisma defaults to use it:

```prisma
id String @id @db.Uuid @default(dbgenerated("uuid_generate_v7()"))
```

If you don't have a v7 function available, use application generation (option
1).

## Enums

### Role

```prisma
enum Role {
    USER
    ADMIN
    MODERATOR
}
```

### Rarity

```prisma
enum Rarity {
    COMMON
    UNCOMMON
    RARE
    EPIC
    LEGENDARY
}
```

### Slot

```prisma
enum Slot {
    NONE
    HEAD
    FACE
    CHEST
    LEGS
    FEET
    HANDS
    ONE_HAND
    TWO_HANDS
    RING
    AMULET
    BELT
    BACKPACK
    CLOAK
}
```

### Sex

```prisma
enum Sex {
    MALE
    FEMALE
}
```

### Visibility

```prisma
enum Visibility {
    PUBLIC
    PRIVATE
    HIDDEN
}
```

## Models

Cursor pagination guidance:

- Use stable, indexed sort keys with a unique tie-breaker: typically
  `(createdAt DESC, id DESC)` or `(level DESC, createdAt DESC, id DESC)`.
- Include filter columns (e.g., ownerId, visibility, archetypeId, raceId) before
  sort keys in composite indexes.
- Avoid relying on text fields like `description` for ordering or filtering.

### User

Core user authentication and profile model.

```prisma
model User {
    // Core fields
    id              String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    email           String  @unique
    passwordHash    String
    role            Role    @default(USER)
    isEmailVerified Boolean @default(false)
    isActive        Boolean @default(true)

    // Optional info fields
    name String?
    bio  String?

    // OAuth fields
    oauthProvider String?
    oauthId       String?

    // Timestamps
    lastPasswordChange DateTime?
    lastLogin          DateTime  @default(now())
    createdAt          DateTime  @default(now())
    updatedAt          DateTime  @updatedAt

    // Moderation fields
    isBanned    Boolean   @default(false)
    banReason   String?
    bannedUntil DateTime?
    bannedById  String?

    // Profile picture
    profilePictureId String? @unique
    profilePicture   Image?  @relation("UserProfilePicture", fields: [profilePictureId], references: [id], onDelete: SetNull)

    // Relations
    characters    Character[]    @relation("UserCharacters")
    images        Image[]        @relation("UserImages")
    tags          Tag[]          @relation("UserTags")
    items         Item[]         @relation("UserItems")
    races         Race[]         @relation("UserRaces")
    perks         Perk[]         @relation("UserPerks")
    skills        Skill[]        @relation("UserSkills")
    archetypes    Archetype[]    @relation("UserArchetypes")
    refreshTokens RefreshToken[] @relation("UserRefreshTokens")

    @@index([email])
    @@index([name])
    @@map("users")
}
```

Index notes (User):

- idx_users_created_at_desc, idx_users_last_login: speed up lists of users by
  recency; good cursor ordering with createdAt/lastLogin.

### RefreshToken

Manages user authentication tokens.

```prisma
model RefreshToken {
    // Core fields
    id        String   @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    token     String   @unique
    userId    String
    user      User     @relation("UserRefreshTokens", fields: [userId], references: [id], onDelete: Cascade)
    expiresAt DateTime
    isRevoked Boolean  @default(false)

    // Device/session info
    deviceInfo String?
    ipAddress  String?
    userAgent  String?

    // Timestamps
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([token])
    @@index([userId])
    @@index([expiresAt])
    @@index([token, isRevoked, expiresAt], name: "idx_refresh_tokens_token_active") // revoke/cleanup by token
    @@index([userId, isRevoked, expiresAt, id], name: "idx_refresh_tokens_user_active") // list active tokens for a user; id as tie-breaker for cursor
    @@map("refresh_tokens")
}
```

Index notes (RefreshToken):

- idx_refresh_tokens_user_active: speeds up queries like “tokens for user
  ordered by expiresAt desc/asc”; id ensures a stable cursor with identical
  expiry times.

### Image

Handles image storage and metadata.

```prisma
model Image {
    // Core fields
    id          String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    blob        Bytes // Binary data for the image
    description String? // Optional description of the image
    size        Int // Size in bytes
    mimeType    String // e.g., "image/png", "image/jpeg"
    width       Int // Image width in pixels
    height      Int // Image height in pixels

    // Owner
    ownerId String?
    owner   User?   @relation("UserImages", fields: [ownerId], references: [id], onDelete: SetNull)

    // Optional profile picture relation
    userProfile User? @relation("UserProfilePicture")

    // Relations
    characters Character[] @relation("CharacterImages")
    races      Race[]      @relation("RaceImages")
    archetypes Archetype[] @relation("ArchetypeImages")
    skills     Skill[]     @relation("SkillImages")
    items      Item[]      @relation("ItemImages")
    perks      Perk[]      @relation("PerkImages")

    // Visibility and metadata
    visibility Visibility @default(PUBLIC)
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt

    @@index([ownerId])
    @@index([visibility])
    @@index([ownerId, visibility, createdAt(sort: Desc), id(sort: Desc)], name: "idx_images_owner_visibility_recent")
    @@index([visibility, createdAt(sort: Desc), id(sort: Desc)], name: "idx_images_visibility_recent")
    @@map("images")
}
```

Index notes (Image):

- idx_images_owner_visibility_recent: fast owner galleries filtered by
  visibility, newest first; id provides deterministic pagination.
- idx_images_visibility_recent: efficient public gallery lists by recency with
  stable cursor.

### Tag

Flexible tagging system for categorization.

```prisma
model Tag {
    // Core fields
    id          String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    name        String  @unique
    description String?

    // Owner
    ownerId String?
    owner   User?   @relation("UserTags", fields: [ownerId], references: [id], onDelete: SetNull)

    // Relations
    skills     Skill[]     @relation("SkillTags")
    perks      Perk[]      @relation("PerkTags")
    races      Race[]      @relation("RaceTags")
    archetypes Archetype[] @relation("ArchetypeTags")
    items      Item[]      @relation("ItemTags")
    characters Character[] @relation("CharacterTags")

    // Visibility and metadata
    visibility Visibility @default(PUBLIC)
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt

    @@index([name])
    @@index([ownerId])
    @@index([visibility])
    @@index([visibility, name, id], name: "idx_tags_visibility_name")
    @@index([ownerId, visibility, name, id], name: "idx_tags_owner_visibility_name")
    @@map("tags")
}
```

Index notes (Tag):

- idx_tags_visibility_name: supports public tag browsing with A-Z ordering; id
  for tie-break ensures cursor stability.
- idx_tags_owner_visibility_name: supports owner-specific tag management with
  predictable ordering.

### Race

Character race definitions with attribute modifiers.

```prisma
model Race {
    // Core fields
    id          String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    name        String  @unique
    description String?

    // Attribute modifiers
    healthModifier       Int @default(100)
    manaModifier         Int @default(100)
    staminaModifier      Int @default(100)
    strengthModifier     Int @default(10)
    constitutionModifier Int @default(10)
    dexterityModifier    Int @default(10)
    intelligenceModifier Int @default(10)
    wisdomModifier       Int @default(10)
    charismaModifier     Int @default(10)

    // Owner
    ownerId String?
    owner   User?   @relation("UserRaces", fields: [ownerId], references: [id], onDelete: SetNull)

    // Image
    imageId String?
    image   Image?  @relation("RaceImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Relations
    characters Character[] @relation("CharacterRaces")
    skills     Skill[]     @relation("RaceSkills")
    archetypes Archetype[] @relation("ArchetypeRequiredRaces")
    tags       Tag[]       @relation("RaceTags")

    // Visibility and metadata
    visibility Visibility @default(PUBLIC)
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt

    @@index([name])
    @@index([ownerId])
    @@index([visibility])
    @@index([ownerId, visibility, name, id], name: "idx_races_owner_visibility_name")
    @@index([visibility, createdAt(sort: Desc), id(sort: Desc)], name: "idx_races_visibility_recent")
    @@index([strengthModifier, constitutionModifier, dexterityModifier], name: "idx_races_modifiers")
    @@map("races")
}
```

Index notes (Race):

- idx_races_owner_visibility_name: fast owner views and admin lists; name order
  for UX; id for cursor.
- idx_races_visibility_recent: efficient public race listings by newest with
  stable pagination.

### Archetype

Character class/archetype definitions.

```prisma
model Archetype {
    // Core fields
    id          String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    name        String  @unique
    description String?

    // Image
    imageId String?
    image   Image?  @relation("ArchetypeImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Relations
    characters    Character[] @relation("CharacterArchetypes")
    skills        Skill[]     @relation("ArchetypeSkills")
    requiredRaces Race[]      @relation("ArchetypeRequiredRaces")
    tags          Tag[]       @relation("ArchetypeTags")

    // Owner
    ownerId String?
    owner   User?   @relation("UserArchetypes", fields: [ownerId], references: [id], onDelete: SetNull)

    // Visibility and metadata
    visibility Visibility @default(PUBLIC)
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt

    @@index([name])
    @@index([ownerId])
    @@index([visibility])
    @@index([ownerId, visibility, name, id], name: "idx_archetypes_owner_visibility_name")
    @@index([visibility, createdAt(sort: Desc), id(sort: Desc)], name: "idx_archetypes_visibility_recent")
    @@map("archetypes")
}
```

Index notes (Archetype):

- idx_archetypes_owner_visibility_name: owner/admin lists with A-Z order and
  stable cursor.
- idx_archetypes_visibility_recent: public archetype feed by recency with
  deterministic pagination.

### Skill

Character skills and abilities.

```prisma
model Skill {
    id            String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    name          String  @unique
    description   String?
    requiredLevel Int     @default(1)

    // Image
    imageId String?
    image   Image?  @relation("SkillImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Relations
    characters Character[] @relation("CharacterSkills")
    races      Race[]      @relation("RaceSkills")
    archetypes Archetype[] @relation("ArchetypeSkills")
    items      Item[]      @relation("ItemBonusSkills")
    tags       Tag[]       @relation("SkillTags")

    // Owner
    ownerId String?
    owner   User?   @relation("UserSkills", fields: [ownerId], references: [id], onDelete: SetNull)

    // Visibility and metadata
    visibility Visibility @default(PUBLIC)
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt

    @@index([name])
    @@index([ownerId])
    @@index([visibility])
    @@index([requiredLevel, visibility, ownerId, id], name: "idx_skills_level_visibility")
    @@index([ownerId, visibility, name, id], name: "idx_skills_owner_visibility_name")
    @@map("skills")
}
```

Index notes (Skill):

- idx_skills_level_visibility: fast filtering by required level within
  owner/visibility; id enables stable cursor order.
- idx_skills_owner_visibility_name: owner lists sorted A-Z; deterministic
  pagination with id.

### Perk

Special character perks and traits.

```prisma
model Perk {
    // Core fields
    id            String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    name          String  @unique
    description   String?
    requiredLevel Int     @default(0)

    // Image
    imageId String?
    image   Image?  @relation("PerkImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Relations
    characters Character[] @relation("CharacterPerks")
    items      Item[]      @relation("ItemBonusPerks")
    tags       Tag[]       @relation("PerkTags")

    // Owner
    ownerId String?
    owner   User?   @relation("UserPerks", fields: [ownerId], references: [id], onDelete: SetNull)

    // Visibility and metadata
    visibility Visibility @default(PUBLIC)
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt

    @@index([name])
    @@index([ownerId])
    @@index([visibility])
    @@index([requiredLevel, visibility, ownerId, id], name: "idx_perks_level_visibility")
    @@index([ownerId, visibility, name, id], name: "idx_perks_owner_visibility_name")
    @@map("perks")
}
```

Index notes (Perk):

- idx_perks_level_visibility: speeds up perk browsing by required level under
  visibility/owner constraints; id = cursor tie-breaker.
- idx_perks_owner_visibility_name: consistent A-Z ordering for owner’s perks.

### Item

Equipment and inventory items.

```prisma
model Item {
    id          String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    name        String  @unique
    description String?

    // Attribute bonuses
    bonusHealth       Int?
    bonusMana         Int?
    bonusStamina      Int?
    bonusStrength     Int?
    bonusConstitution Int?
    bonusDexterity    Int?
    bonusIntelligence Int?
    bonusWisdom       Int?
    bonusCharisma     Int?

    // Combat stats
    damage  Int? // For weapons
    defense Int? // For armor

    // Item properties
    rarity        Rarity  @default(COMMON)
    slot          Slot    @default(NONE)
    requiredLevel Int     @default(1)
    weight        Float   @default(1.0)
    durability    Int     @default(100)
    maxDurability Int     @default(100)
    value         Int     @default(0)
    bonusSkills   Skill[] @relation("ItemBonusSkills")
    bonusPerks    Perk[]  @relation("ItemBonusPerks")
    tags          Tag[]   @relation("ItemTags")

    // Item flags
    is2Handed    Boolean @default(false)
    isThrowable  Boolean @default(false)
    isConsumable Boolean @default(false)
    isQuestItem  Boolean @default(false)
    isTradeable  Boolean @default(true)

    // Owner
    ownerId String?
    owner   User?   @relation("UserItems", fields: [ownerId], references: [id], onDelete: SetNull)

    // Image
    imageId String?
    image   Image?  @relation("ItemImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Equipment - relations with specific item slots
    equipmentHeadSlot      Equipment[] @relation("EquipmentHead")
    Equipment              Equipment[] @relation("EquipmentFace")
    equipmentChestSlot     Equipment[] @relation("EquipmentChest")
    equipmentLegsSlot      Equipment[] @relation("EquipmentLegs")
    equipmentFeetSlot      Equipment[] @relation("EquipmentFeet")
    equipmentHandsSlot     Equipment[] @relation("EquipmentHands")
    equipmentRightHandSlot Equipment[] @relation("EquipmentRightHand")
    equipmentLeftHandSlot  Equipment[] @relation("EquipmentLeftHand")
    equipmentRightRingSlot Equipment[] @relation("EquipmentRightRing")
    equipmentLeftRingSlot  Equipment[] @relation("EquipmentLeftRing")
    equipmentAmuletSlot    Equipment[] @relation("EquipmentAmulet")
    equipmentBeltSlot      Equipment[] @relation("EquipmentBelt")
    equipmentBackpackSlot  Equipment[] @relation("EquipmentBackpack")
    equipmentCloakSlot     Equipment[] @relation("EquipmentCloak")

    // Inventory
    characterInventories Character[] @relation("CharacterInventory")

    // Visibility and metadata
    visibility Visibility @default(PUBLIC)
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt

    @@index([name])
    @@index([rarity])
    @@index([slot])
    @@index([requiredLevel])
    @@index([ownerId])
    @@index([visibility])
    @@index([rarity, slot, requiredLevel, visibility, id], name: "idx_items_rarity_slot_level")
    @@index([ownerId, visibility, name, id], name: "idx_items_owner_visibility_name")
    @@index([ownerId, visibility, createdAt(sort: Desc), id(sort: Desc)], name: "idx_items_owner_recent")
    @@index([slot, requiredLevel], name: "idx_items_slot_level")
    @@index([damage, defense], name: "idx_items_combat_stats")
    @@map("items")
}
```

Index notes (Item):

- idx_items_owner_recent: common “my items” list by newest; id supports stable
  cursor.
- idx_items_owner_visibility_name: fast filtering + A-Z sort for owner
  inventories.
- idx_items_rarity_slot_level: multi-facet filter lists (rarity/slot/level) for
  browsing and shop pages.

### Equipment

Character equipment slots system.

```prisma
model Equipment {
    id          String    @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    characterId String    @unique
    character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

    // Fixed slots — each supports specific item types
    headId String?
    head   Item?   @relation("EquipmentHead", fields: [headId], references: [id], onDelete: SetNull)

    faceId String?
    face   Item?   @relation("EquipmentFace", fields: [faceId], references: [id], onDelete: SetNull)

    chestId String?
    chest   Item?   @relation("EquipmentChest", fields: [chestId], references: [id], onDelete: SetNull)

    legsId String?
    legs   Item?   @relation("EquipmentLegs", fields: [legsId], references: [id], onDelete: SetNull)

    feetId String?
    feet   Item?   @relation("EquipmentFeet", fields: [feetId], references: [id], onDelete: SetNull)

    handsId String?
    hands   Item?   @relation("EquipmentHands", fields: [handsId], references: [id], onDelete: SetNull)

    rightHandId String?
    rightHand   Item?   @relation("EquipmentRightHand", fields: [rightHandId], references: [id], onDelete: SetNull)

    leftHandId String?
    leftHand   Item?   @relation("EquipmentLeftHand", fields: [leftHandId], references: [id], onDelete: SetNull)

    rightRingId String?
    rightRing   Item?   @relation("EquipmentRightRing", fields: [rightRingId], references: [id], onDelete: SetNull)

    leftRingId String?
    leftRing   Item?   @relation("EquipmentLeftRing", fields: [leftRingId], references: [id], onDelete: SetNull)

    amuletId String?
    amulet   Item?   @relation("EquipmentAmulet", fields: [amuletId], references: [id], onDelete: SetNull)

    beltId String?
    belt   Item?   @relation("EquipmentBelt", fields: [beltId], references: [id], onDelete: SetNull)

    backpackId String?
    backpack   Item?   @relation("EquipmentBackpack", fields: [backpackId], references: [id], onDelete: SetNull)

    cloakId String?
    cloak   Item?   @relation("EquipmentCloak", fields: [cloakId], references: [id], onDelete: SetNull)

    // Metadata
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([characterId])
    @@map("equipment")
}
```

### Character

Main character model with all game attributes.

```prisma
model Character {
    id          String  @id @db.Uuid @default(dbgenerated("uuid_generate_v7()")) // or app-generated uuidv7()
    name        String  @unique
    sex         Sex     @default(MALE)
    age         Int     @default(18)
    description String?
    level       Int     @default(1)
    experience  Int     @default(0)

    // Image
    imageId String?
    image   Image?  @relation("CharacterImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Owner
    ownerId String
    owner   User   @relation("UserCharacters", fields: [ownerId], references: [id], onDelete: Cascade)

    // Core attributes
    health  Int @default(100)
    mana    Int @default(100)
    stamina Int @default(100)

    // Primary attributes
    strength     Int @default(10)
    constitution Int @default(10)
    dexterity    Int @default(10)
    intelligence Int @default(10)
    wisdom       Int @default(10)
    charisma     Int @default(10)

    // Character
    raceId      String
    race        Race      @relation("CharacterRaces", fields: [raceId], references: [id], onDelete: Restrict)
    archetypeId String
    archetype   Archetype @relation("CharacterArchetypes", fields: [archetypeId], references: [id], onDelete: Restrict)

    // Equipment — dedicated entity with fixed slots
    equipment Equipment?

    // Inventory
    inventory Item[] @relation("CharacterInventory")

    // Other relations
    skills Skill[] @relation("CharacterSkills")
    perks  Perk[]  @relation("CharacterPerks")
    tags   Tag[]   @relation("CharacterTags")

    // Visibility and metadata
    visibility Visibility @default(PUBLIC)
    createdAt  DateTime   @default(now())
    updatedAt  DateTime   @updatedAt

    @@index([ownerId, visibility, createdAt(sort: Desc), id(sort: Desc)], name: "idx_characters_owner_recent")
    @@index([ownerId, visibility, archetypeId, raceId, level(sort: Desc), createdAt(sort: Desc), id(sort: Desc)], name: "idx_characters_search_core")
    @@index([archetypeId, raceId, visibility, level(sort: Desc), createdAt(sort: Desc), id(sort: Desc)], name: "idx_characters_taxonomy")
    @@map("characters")
}
```

Index notes (Character):

- idx_characters_owner_recent: speeds up “my characters” views (owner +
  visibility) ordered by newest; id ensures deterministic cursor.
- idx_characters_search_core: common filtered lists by owner + archetype +
  race + level desc → ideal for cursor-based infinite scroll.
- idx_characters_taxonomy: public browsing by archetype/race with level desc and
  recency; id keeps pagination stable.
