# Fantasy Characters API - Data Models

This document outlines the actual data models for the Fantasy Characters API
using Prisma schema format. This reflects the current implementation.

## Current Implementation Status

**✅ Implemented Models:**

- All core models (User, Character, Race, Archetype, etc.)
- Complete relational structure with join tables
- Proper indexing for performance
- UUIDv7 application-generated IDs

**⚠️ Key Implementation Details:**

- UUIDs are application-generated (not database-generated)
- Many-to-many relationships use explicit join tables
- Equipment slots use `onDelete: Restrict` (not `SetNull`)
- All foreign key fields explicitly use `@db.Uuid`

**📋 Documentation vs Implementation:**

The original documentation showed aspirational designs. This version reflects
the actual implemented schema with these key differences:

- **User model**: Includes passwordHash and email verification fields; OAuth
  fields present but not yet implemented
- **Character model**: Uses explicit join tables instead of direct many-to-many
  relations
- **Equipment model**: Uses `Restrict` delete behavior for better data integrity
- **Join tables**: Explicitly modeled for CharacterSkill, CharacterPerk, etc.
- **IDs**: Application-generated UUIDs instead of database functions

## Database Configuration

````prisma
generator client {
    provider = "prisma-client-js"
}

datasource d### Equipment

Character equipment with fixed slots.

```prisma
model Equipment {
  id          String    @id @db.Uuid
  characterId String    @unique @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  headId      String?   @db.Uuid
  head        Item?     @relation("EquipmentHead", fields: [headId], references: [id], onDelete: Restrict)
  chestId     String?   @db.Uuid
  chest       Item?     @relation("EquipmentChest", fields: [chestId], references: [id], onDelete: Restrict)
  legsId      String?   @db.Uuid
  legs        Item?     @relation("EquipmentLegs", fields: [legsId], references: [id], onDelete: Restrict)
  feetId      String?   @db.Uuid
  feet        Item?     @relation("EquipmentFeet", fields: [feetId], references: [id], onDelete: Restrict)
  handsId     String?   @db.Uuid
  hands       Item?     @relation("EquipmentHands", fields: [handsId], references: [id], onDelete: Restrict)
  mainHandId  String?   @db.Uuid
  mainHand    Item?     @relation("EquipmentMainHand", fields: [mainHandId], references: [id], onDelete: Restrict)
  offHandId   String?   @db.Uuid
  offHand     Item?     @relation("EquipmentOffHand", fields: [offHandId], references: [id], onDelete: Restrict)
  neckId      String?   @db.Uuid
  neck        Item?     @relation("EquipmentNeck", fields: [neckId], references: [id], onDelete: Restrict)
  ring1Id     String?   @db.Uuid
  ring1       Item?     @relation("EquipmentRing1", fields: [ring1Id], references: [id], onDelete: Restrict)
  ring2Id     String?   @db.Uuid
  ring2       Item?     @relation("EquipmentRing2", fields: [ring2Id], references: [id], onDelete: Restrict)

  @@map("equipment")
}
````

**Key Implementation Notes:**

- Uses `onDelete: Restrict` (not `SetNull`) for equipment slots
- Each slot has dedicated relation name for Prisma compatibility
- Character relationship is one-to-one with cascade deleteprovider =
  "postgresql" url = env("DATABASE_URL") }

````

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
````

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
  id                 String    @id @db.Uuid
  email              String    @unique
  passwordHash       String
  name               String?
  bio                String?
  role               Role      @default(USER)
  isEmailVerified    Boolean   @default(false)
  isActive           Boolean   @default(true)
  lastLogin          DateTime  @default(now())
  lastPasswordChange DateTime?
  isBanned           Boolean   @default(false)
  banReason          String?
  bannedUntil        DateTime?
  bannedById         String?   @db.Uuid
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // OAuth fields (ready for implementation)
  oauthProvider      String?
  oauthId            String?

  // Profile picture
  profilePictureId   String?   @unique @db.Uuid
  profilePicture     Image?    @relation("UserProfilePicture", fields: [profilePictureId], references: [id], onDelete: SetNull)

  // Relations (actual implementation uses different relation names)
  characters         Character[] @relation("UserCharacters")
  images             Image[]     @relation("UserImages")
  tags               Tag[]       @relation("UserTags")
  items              Item[]      @relation("UserItems")
  races              Race[]      @relation("UserRaces")
  perks              Perk[]      @relation("UserPerks")
  skills             Skill[]     @relation("UserSkills")
  archetypes         Archetype[] @relation("UserArchetypes")
  refreshTokens      RefreshToken[] @relation("UserRefreshTokens")

  @@map("users")
}
```

**Key Implementation Notes:**

- **passwordHash**: ✅ Implemented - Argon2id hashed passwords
- **isEmailVerified**: ✅ Implemented - Email verification system (needed for
  security)
- **isActive**: ⚠️ Present but unused - Could be removed or used for account
  deactivation
- **OAuth fields**: 📋 Ready for implementation (`oauthProvider`, `oauthId`)
- **Relations**: Use explicit relation names for Prisma compatibility

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

### Join Tables (Many-to-Many Relationships)

The implementation uses explicit join tables for all many-to-many relationships:

### CharacterSkill

```prisma
model CharacterSkill {
  characterId String    @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  skillId     String    @db.Uuid
  skill       Skill     @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@id([characterId, skillId])
  @@map("character_skills")
}
```

### CharacterPerk

```prisma
model CharacterPerk {
  characterId String    @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  perkId      String    @db.Uuid
  perk        Perk      @relation(fields: [perkId], references: [id], onDelete: Cascade)

  @@id([characterId, perkId])
  @@map("character_perks")
}
```

### CharacterTag

```prisma
model CharacterTag {
  characterId String    @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  tagId       String    @db.Uuid
  tag         Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([characterId, tagId])
  @@map("character_tags")
}
```

### CharacterItem (Inventory)

```prisma
model CharacterItem {
  characterId String    @db.Uuid
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  itemId      String    @db.Uuid
  item        Item      @relation(fields: [itemId], references: [id], onDelete: Cascade)
  quantity    Int       @default(1)

  @@id([characterId, itemId])
  @@map("character_items")
}
```

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
  id          String      @id @db.Uuid
  name        String
  sex         Sex         @default(MALE)
  age         Int         @default(18)
  description String?
  level       Int         @default(1)
  experience  Int         @default(0)
  health      Int         @default(100)
  mana        Int         @default(100)
  stamina     Int         @default(100)
  strength    Int         @default(10)
  constitution Int        @default(10)
  dexterity   Int         @default(10)
  intelligence Int        @default(10)
  wisdom      Int         @default(10)
  charisma    Int         @default(10)
  visibility  Visibility  @default(PUBLIC)
  raceId      String      @db.Uuid
  race        Race        @relation(fields: [raceId], references: [id], onDelete: Restrict)
  archetypeId String      @db.Uuid
  archetype   Archetype   @relation(fields: [archetypeId], references: [id], onDelete: Restrict)
  imageId     String?     @db.Uuid
  image       Image?      @relation(fields: [imageId], references: [id], onDelete: SetNull)
  ownerId     String      @db.Uuid
  owner       User        @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Equipment - separate entity with fixed slots
  equipment     Equipment?

  // Many-to-many relationships via join tables
  characterSkills CharacterSkill[]
  characterPerks  CharacterPerk[]
  characterTags   CharacterTag[]
  characterItems  CharacterItem[]

  @@map("characters")
}
```

**Key Implementation Notes:**

- Uses explicit join tables for many-to-many relationships
- Equipment is separate entity (not inline)
- All foreign keys use `@db.Uuid` annotation
- `onDelete: Restrict` for race/archetype (not cascade)
- Simplified indexing compared to documentation

### Equipment

- idx_characters_owner_recent: speeds up “my characters” views (owner +
  visibility) ordered by newest; id ensures deterministic cursor.
- idx_characters_search_core: common filtered lists by owner + archetype +
  race + level desc → ideal for cursor-based infinite scroll.
- idx_characters_taxonomy: public browsing by archetype/race with level desc and
  recency; id keeps pagination stable.
