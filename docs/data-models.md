# Data Models

## Core Enums

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
  FACE = 'face',
  CHEST = 'chest',
  LEGS = 'legs',
  FEET = 'feet',
  HANDS = 'hands',
  ONE_HAND = 'one_hand',
  TWO_HANDS = 'two_hands',
  RING = 'ring',
  AMULET = 'amulet',
  BELT = 'belt',
  BACKPACK = 'backpack',
  CLOAK = 'cloak',
}

enum Sex {
  MALE = 'male',
  FEMALE = 'female',
}

enum Visibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  HIDDEN = 'hidden',
}
```

## Authentication & Media Models

### User Model

```typescript
interface User {
    id: string @id @default(uuid())
    email: string @unique
    passwordHash: string
    role: Role @default(USER)
    isEmailVerified: boolean @default(false)
    isActive: boolean @default(true)

    // Optional info fields
    name: string?
    bio: string?

    // OAuth fields
    oauthProvider: string?
    oauthId: string?

    // Timestamps
    lastPasswordChange: DateTime?
    lastLogin: DateTime @default(now())
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt

    // Moderation fields (KISS approach)
    isBanned: boolean @default(false)
    banReason: string?
    bannedUntil: DateTime?
    bannedById: string?

    // Profile picture relationship
    profilePictureId: string? @unique
    profilePicture: Image? @relation("UserProfilePicture", fields: [profilePictureId], references: [id], onDelete: SetNull)

    // Relations with ownership-based system
    characters: Character[] @relation("UserCharacters")
    images: Image[] @relation("UserImages")
    tags: Tag[] @relation("UserTags")
    items: Item[] @relation("UserItems")
    races: Race[] @relation("UserRaces")
    perks: Perk[] @relation("UserPerks")
    skills: Skill[] @relation("UserSkills")
    archetypes: Archetype[] @relation("UserArchetypes")
    refreshTokens: RefreshToken[] @relation("UserRefreshTokens")
}
```

### RefreshToken Model

```typescript
interface RefreshToken {
    id: string @id @default(uuid())
    token: string @unique
    userId: string
    user: User @relation("UserRefreshTokens", fields: [userId], references: [id], onDelete: Cascade)
    expiresAt: DateTime
    isRevoked: boolean @default(false)

    // Device/session info
    deviceInfo: string?
    ipAddress: string?
    userAgent: string?

    // Timestamps
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

### Image Model

```typescript
interface Image {
    id: string @id @default(uuid())
    blob: Bytes // Binary data for the image (WebP format, max 350x450px)
    description: string? // Optional description
    filename: string
    size: Int // Size in bytes
    mimeType: string // Always "image/webp" after processing
    width: Int // Image width in pixels (max 350)
    height: Int // Image height in pixels (max 450)

    // Owner (nullable for orphaned images)
    ownerId: string?
    owner: User? @relation("UserImages", fields: [ownerId], references: [id], onDelete: SetNull)

    // Profile picture relationship (inverse side)
    userProfile: User? @relation("UserProfilePicture")

    // Content relationships
    characters: Character[] @relation("CharacterImages")
    races: Race[] @relation("RaceImages")
    archetypes: Archetype[] @relation("ArchetypeImages")
    skills: Skill[] @relation("SkillImages")
    items: Item[] @relation("ItemImages")
    perks: Perk[] @relation("PerkImages")

    // Visibility and metadata
    visibility: Visibility @default(PUBLIC)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

## Game System Models

### Tag Model

```typescript
interface Tag {
    id: string @id @default(uuid())
    name: string @unique
    description: string?

    // Owner (nullable for orphaned tags)
    ownerId: string?
    owner: User? @relation("UserTags", fields: [ownerId], references: [id], onDelete: SetNull)

    // Relations
    skills: Skill[] @relation("SkillTags")
    perks: Perk[] @relation("PerkTags")
    races: Race[] @relation("RaceTags")
    archetypes: Archetype[] @relation("ArchetypeTags")
    items: Item[] @relation("ItemTags")
    characters: Character[] @relation("CharacterTags")

    // Visibility and metadata
    visibility: Visibility @default(PUBLIC)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

### Race Model

```typescript
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

    // Owner (nullable for orphaned races)
    ownerId: string?
    owner: User? @relation("UserRaces", fields: [ownerId], references: [id], onDelete: SetNull)

    // Image with SetNull deletion
    imageId: string?
    image: Image? @relation("RaceImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Relations
    characters: Character[] @relation("CharacterRaces")
    skills: Skill[] @relation("RaceSkills")
    archetypes: Archetype[] @relation("ArchetypeRequiredRaces")
    tags: Tag[] @relation("RaceTags")

    // Visibility and metadata
    visibility: Visibility @default(PUBLIC)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

### Archetype Model

```typescript
interface Archetype {
    id: string @id @default(uuid())
    name: string @unique
    description: string?

    // Image with SetNull deletion
    imageId: string?
    image: Image? @relation("ArchetypeImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Relations
    characters: Character[] @relation("CharacterArchetypes")
    skills: Skill[] @relation("ArchetypeSkills")
    requiredRaces: Race[] @relation("ArchetypeRequiredRaces")
    tags: Tag[] @relation("ArchetypeTags")

    // Owner (nullable for orphaned archetypes)
    ownerId: string?
    owner: User? @relation("UserArchetypes", fields: [ownerId], references: [id], onDelete: SetNull)

    // Visibility and metadata
    visibility: Visibility @default(PUBLIC)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

### Skill Model

```typescript
interface Skill {
    id: string @id @default(uuid())
    name: string @unique
    description: string?
    requiredLevel: Int @default(1)

    // Image with SetNull deletion
    imageId: string?
    image: Image? @relation("SkillImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Relations
    characters: Character[] @relation("CharacterSkills")
    races: Race[] @relation("RaceSkills")
    archetypes: Archetype[] @relation("ArchetypeSkills")
    items: Item[] @relation("ItemBonusSkills")
    tags: Tag[] @relation("SkillTags")

    // Owner (nullable for orphaned skills)
    ownerId: string?
    owner: User? @relation("UserSkills", fields: [ownerId], references: [id], onDelete: SetNull)

    // Visibility and metadata
    visibility: Visibility @default(PUBLIC)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

### Perk Model

```typescript
interface Perk {
    id: string @id @default(uuid())
    name: string @unique
    description: string?
    requiredLevel: Int @default(0)

    // Image with SetNull deletion
    imageId: string?
    image: Image? @relation("PerkImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Relations
    characters: Character[] @relation("CharacterPerks")
    items: Item[] @relation("ItemBonusPerks")
    tags: Tag[] @relation("PerkTags")

    // Owner (nullable for orphaned perks)
    ownerId: string?
    owner: User? @relation("UserPerks", fields: [ownerId], references: [id], onDelete: SetNull)

    // Visibility and metadata
    visibility: Visibility @default(PUBLIC)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

## Item System Models

### Item Model

```typescript
interface Item {
    id: string @id @default(uuid())
    name: string @unique
    description: string?

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
    rarity: Rarity @default(COMMON)
    slot: Slot @default(NONE)
    requiredLevel: Int @default(1)
    weight: Float @default(1.0)
    durability: Int @default(100)
    maxDurability: Int @default(100)
    value: Int @default(0)
    bonusSkills: Skill[] @relation("ItemBonusSkills")
    bonusPerks: Perk[] @relation("ItemBonusPerks")
    tags: Tag[] @relation("ItemTags")

    // Item flags
    is2Handed: Boolean @default(false)
    isThrowable: Boolean @default(false)
    isConsumable: Boolean @default(false)
    isQuestItem: Boolean @default(false)
    isTradeable: Boolean @default(true)

    // Owner (nullable for orphaned items)
    ownerId: string?
    owner: User? @relation("UserItems", fields: [ownerId], references: [id], onDelete: SetNull)

    // Image with SetNull deletion
    imageId: string?
    image: Image? @relation("ItemImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Equipment relations with new Equipment system
    equipmentHeadSlot: Equipment[] @relation("EquipmentHead")
    equipmentFaceSlot: Equipment[] @relation("EquipmentFace")
    equipmentChestSlot: Equipment[] @relation("EquipmentChest")
    equipmentLegsSlot: Equipment[] @relation("EquipmentLegs")
    equipmentFeetSlot: Equipment[] @relation("EquipmentFeet")
    equipmentHandsSlot: Equipment[] @relation("EquipmentHands")
    equipmentRightHandSlot: Equipment[] @relation("EquipmentRightHand")
    equipmentLeftHandSlot: Equipment[] @relation("EquipmentLeftHand")
    equipmentRightRingSlot: Equipment[] @relation("EquipmentRightRing")
    equipmentLeftRingSlot: Equipment[] @relation("EquipmentLeftRing")
    equipmentAmuletSlot: Equipment[] @relation("EquipmentAmulet")
    equipmentBeltSlot: Equipment[] @relation("EquipmentBelt")
    equipmentBackpackSlot: Equipment[] @relation("EquipmentBackpack")
    equipmentCloakSlot: Equipment[] @relation("EquipmentCloak")

    // Inventory
    characterInventories: Character[] @relation("CharacterInventory")

    // Visibility and metadata
    visibility: Visibility @default(PUBLIC)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

### Equipment Model

```typescript
interface Equipment {
    id: string @id @default(uuid())
    characterId: string @unique
    character: Character @relation(fields: [characterId], references: [id], onDelete: Cascade)

    // Fixed slots - each slot supports specific item types
    headId: string?
    head: Item? @relation("EquipmentHead", fields: [headId], references: [id], onDelete: SetNull)

    faceId: string?
    face: Item? @relation("EquipmentFace", fields: [faceId], references: [id], onDelete: SetNull)

    chestId: string?
    chest: Item? @relation("EquipmentChest", fields: [chestId], references: [id], onDelete: SetNull)

    legsId: string?
    legs: Item? @relation("EquipmentLegs", fields: [legsId], references: [id], onDelete: SetNull)

    feetId: string?
    feet: Item? @relation("EquipmentFeet", fields: [feetId], references: [id], onDelete: SetNull)

    handsId: string?
    hands: Item? @relation("EquipmentHands", fields: [handsId], references: [id], onDelete: SetNull)

    rightHandId: string?
    rightHand: Item? @relation("EquipmentRightHand", fields: [rightHandId], references: [id], onDelete: SetNull)

    leftHandId: string?
    leftHand: Item? @relation("EquipmentLeftHand", fields: [leftHandId], references: [id], onDelete: SetNull)

    rightRingId: string?
    rightRing: Item? @relation("EquipmentRightRing", fields: [rightRingId], references: [id], onDelete: SetNull)

    leftRingId: string?
    leftRing: Item? @relation("EquipmentLeftRing", fields: [leftRingId], references: [id], onDelete: SetNull)

    amuletId: string?
    amulet: Item? @relation("EquipmentAmulet", fields: [amuletId], references: [id], onDelete: SetNull)

    beltId: string?
    belt: Item? @relation("EquipmentBelt", fields: [beltId], references: [id], onDelete: SetNull)

    backpackId: string?
    backpack: Item? @relation("EquipmentBackpack", fields: [backpackId], references: [id], onDelete: SetNull)

    cloakId: string?
    cloak: Item? @relation("EquipmentCloak", fields: [cloakId], references: [id], onDelete: SetNull)

    // Metadata
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```

### Character Model

```typescript
interface Character {
    id: string @id @default(uuid())
    name: string @unique
    sex: Sex @default(MALE)
    age: Int @default(18)
    description: string?
    level: Int @default(1)
    experience: Int @default(0)

    // Image with SetNull deletion
    imageId: string?
    image: Image? @relation("CharacterImages", fields: [imageId], references: [id], onDelete: SetNull)

    // Owner
    ownerId: string
    owner: User @relation("UserCharacters", fields: [ownerId], references: [id], onDelete: Cascade)

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

    // Character relations
    raceId: string
    race: Race @relation("CharacterRaces", fields: [raceId], references: [id], onDelete: Restrict)
    archetypeId: string
    archetype: Archetype @relation("CharacterArchetypes", fields: [archetypeId], references: [id], onDelete: Restrict)

    // Equipment - dedicated entity with fixed slots
    equipment: Equipment?

    // Inventory
    inventory: Item[] @relation("CharacterInventory")

    // Other relations
    skills: Skill[] @relation("CharacterSkills")
    perks: Perk[] @relation("CharacterPerks")
    tags: Tag[] @relation("CharacterTags")

    // Visibility and metadata
    visibility: Visibility @default(PUBLIC)
    createdAt: DateTime @default(now())
    updatedAt: DateTime @updatedAt
}
```
