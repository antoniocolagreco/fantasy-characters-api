/**
 * OpenAPI Schema Components
 * Comprehensive schema definitions for Swagger documentation
 * Centralizes all schemas used across the API
 */

import { Type } from '@sinclair/typebox'

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const RoleSchema = Type.String({
  enum: ['USER', 'MODERATOR', 'ADMIN'],
  description: 'User role with hierarchical permissions',
  examples: ['USER'],
})

export const VisibilitySchema = Type.String({
  enum: ['PUBLIC', 'PRIVATE', 'HIDDEN'],
  description: 'Content visibility level',
  examples: ['PUBLIC'],
})

export const SexSchema = Type.String({
  enum: ['MALE', 'FEMALE'],
  description: 'Character biological sex',
  examples: ['MALE'],
})

export const RaritySchema = Type.String({
  enum: ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'],
  description: 'Item rarity classification',
  examples: ['COMMON'],
})

export const SlotSchema = Type.String({
  enum: [
    'NONE',
    'HEAD',
    'FACE',
    'CHEST',
    'LEGS',
    'FEET',
    'HANDS',
    'ONE_HAND',
    'TWO_HANDS',
    'RING',
    'AMULET',
    'BELT',
    'BACKPACK',
    'CLOAK',
  ],
  description: 'Equipment slot type for items',
  examples: ['HEAD'],
})

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const UUIDSchema = Type.String({
  format: 'uuid',
  description: 'Universally unique identifier',
  examples: ['123e4567-e89b-12d3-a456-426614174000'],
})

export const TimestampSchema = Type.String({
  format: 'date-time',
  description: 'ISO 8601 timestamp',
  examples: ['2023-12-01T10:00:00.000Z'],
})

export const EmailSchema = Type.String({
  format: 'email',
  description: 'Valid email address',
  examples: ['user@example.com'],
})

export const PasswordSchema = Type.String({
  minLength: 8,
  maxLength: 128,
  description: 'User password (minimum 8 characters)',
  examples: ['SecurePassword123!'],
})

export const NameSchema = Type.String({
  minLength: 2,
  maxLength: 100,
  description: 'Name field with length validation',
  examples: ['Aragorn'],
})

export const DescriptionSchema = Type.String({
  maxLength: 1000,
  description: 'Optional description field',
  examples: ['A brave warrior from the north'],
})

// ============================================================================
// ERROR SCHEMAS
// ============================================================================

export const ErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.String({
      description: 'Error code identifier',
      examples: ['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED'],
    }),
    message: Type.String({
      description: 'Human-readable error message',
      examples: ['Validation failed', 'Resource not found'],
    }),
    timestamp: TimestampSchema,
    path: Type.String({
      description: 'Request path where error occurred',
      examples: ['/api/characters'],
    }),
    details: Type.Optional(
      Type.Array(
        Type.Object({
          field: Type.String({
            description: 'Field that failed validation',
            examples: ['name'],
          }),
          message: Type.String({
            description: 'Field-specific error message',
            examples: ['Name is required'],
          }),
          value: Type.Unknown({
            description: 'Invalid value that was provided',
          }),
        }),
        {
          description: 'Detailed validation errors',
        },
      ),
    ),
  }),
})

export const ValidationErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.Literal('VALIDATION_ERROR'),
    message: Type.String({
      default: 'Validation failed',
      examples: ['Validation failed'],
    }),
    timestamp: TimestampSchema,
    path: Type.String({
      examples: ['/api/characters'],
    }),
    details: Type.Array(
      Type.Object({
        field: Type.String({
          examples: ['name'],
        }),
        message: Type.String({
          examples: ['Name is required'],
        }),
        value: Type.Unknown(),
      }),
    ),
  }),
})

export const NotFoundErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.Literal('NOT_FOUND'),
    message: Type.String({
      default: 'Resource not found',
      examples: ['Character not found'],
    }),
    timestamp: TimestampSchema,
    path: Type.String({
      examples: ['/api/characters/123'],
    }),
  }),
})

export const UnauthorizedErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.Literal('UNAUTHORIZED'),
    message: Type.String({
      default: 'Authentication required',
      examples: ['Authentication required'],
    }),
    timestamp: TimestampSchema,
    path: Type.String({
      examples: ['/api/characters'],
    }),
  }),
})

export const ForbiddenErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.Literal('FORBIDDEN'),
    message: Type.String({
      default: 'Insufficient permissions',
      examples: ['Insufficient permissions to access this resource'],
    }),
    timestamp: TimestampSchema,
    path: Type.String({
      examples: ['/api/users'],
    }),
  }),
})

export const ConflictErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.Literal('CONFLICT'),
    message: Type.String({
      default: 'Resource conflict',
      examples: ['Character with this name already exists'],
    }),
    timestamp: TimestampSchema,
    path: Type.String({
      examples: ['/api/characters'],
    }),
  }),
})

export const RateLimitErrorSchema = Type.Object({
  error: Type.Object({
    code: Type.Literal('TOO_MANY_REQUESTS'),
    message: Type.String({
      default: 'Rate limit exceeded',
      examples: ['Rate limit exceeded, retry in 60s'],
    }),
    timestamp: TimestampSchema,
    path: Type.String({
      examples: ['/api/auth/login'],
    }),
    retryAfter: Type.Number({
      description: 'Seconds until rate limit resets',
      examples: [60],
    }),
  }),
})

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

export const PaginationQuerySchema = Type.Object({
  page: Type.Optional(
    Type.Integer({
      minimum: 1,
      default: 1,
      description: 'Current page number (starts from 1)',
      examples: [1],
    }),
  ),
  pageSize: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 100,
      default: 10,
      description: 'Items per page (1-100)',
      examples: [10],
    }),
  ),
  sortBy: Type.Optional(
    Type.String({
      minLength: 1,
      description: 'Field to sort by (entity-specific)',
      examples: ['name'],
    }),
  ),
  sortOrder: Type.Optional(
    Type.String({
      enum: ['asc', 'desc'],
      description: 'Sort order: ascending or descending',
      examples: ['asc'],
    }),
  ),
})

export const PaginationMetaSchema = Type.Object({
  total: Type.Integer({
    minimum: 0,
    description: 'Total number of items',
    examples: [150],
  }),
  page: Type.Integer({
    minimum: 1,
    description: 'Current page number',
    examples: [1],
  }),
  pageSize: Type.Integer({
    minimum: 1,
    maximum: 100,
    description: 'Items per page',
    examples: [10],
  }),
  totalPages: Type.Integer({
    minimum: 0,
    description: 'Total number of pages',
    examples: [15],
  }),
})

// ============================================================================
// USER SCHEMAS
// ============================================================================

export const UserResponseSchema = Type.Object({
  id: UUIDSchema,
  email: EmailSchema,
  name: Type.Union([NameSchema, Type.Null()], {
    description: 'User display name',
  }),
  bio: Type.Union([Type.String({ maxLength: 500 }), Type.Null()], {
    description: 'User biography',
  }),
  role: RoleSchema,
  isEmailVerified: Type.Boolean({
    description: 'Email verification status',
    examples: [true],
  }),
  isActive: Type.Boolean({
    description: 'User account status',
    examples: [true],
  }),
  lastLogin: TimestampSchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  profilePictureId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Profile picture image ID',
  }),
})

export const CreateUserSchema = Type.Object({
  email: EmailSchema,
  password: PasswordSchema,
  name: Type.Optional(NameSchema),
  bio: Type.Optional(Type.String({ maxLength: 500 })),
  role: Type.Optional(RoleSchema),
})

export const UpdateUserSchema = Type.Object({
  email: Type.Optional(EmailSchema),
  name: Type.Optional(NameSchema),
  bio: Type.Optional(Type.String({ maxLength: 500 })),
  role: Type.Optional(RoleSchema),
  isEmailVerified: Type.Optional(Type.Boolean()),
  isActive: Type.Optional(Type.Boolean()),
})

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const LoginRequestSchema = Type.Object({
  email: EmailSchema,
  password: Type.String({
    description: 'User password',
  }),
})

export const RegisterRequestSchema = Type.Object({
  email: EmailSchema,
  password: PasswordSchema,
  name: Type.Optional(NameSchema),
  bio: Type.Optional(Type.String({ maxLength: 500 })),
})

export const TokenResponseSchema = Type.Object({
  accessToken: Type.String({
    description: 'JWT access token (expires in 15 minutes)',
    examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'],
  }),
  refreshToken: Type.String({
    description: 'JWT refresh token (expires in 7 days)',
    examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'],
  }),
  tokenType: Type.String({
    default: 'Bearer',
    description: 'Token type for Authorization header',
    examples: ['Bearer'],
  }),
  expiresIn: Type.String({
    description: 'Access token expiration time',
    examples: ['15m'],
  }),
  user: UserResponseSchema,
})

export const RefreshTokenRequestSchema = Type.Object({
  refreshToken: Type.String({
    description: 'Valid refresh token',
    examples: ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'],
  }),
})

export const ChangePasswordRequestSchema = Type.Object({
  currentPassword: Type.String({
    description: 'Current user password',
  }),
  newPassword: PasswordSchema,
})

// ============================================================================
// IMAGE SCHEMAS
// ============================================================================

export const ImageResponseSchema = Type.Object({
  id: UUIDSchema,
  filename: Type.String({
    description: 'Original filename',
    examples: ['character-portrait.webp'],
  }),
  description: Type.Union([DescriptionSchema, Type.Null()], {
    description: 'Image description',
  }),
  size: Type.Integer({
    minimum: 0,
    description: 'File size in bytes',
    examples: [245760],
  }),
  mimeType: Type.String({
    description: 'MIME type (always image/webp after processing)',
    examples: ['image/webp'],
  }),
  width: Type.Integer({
    minimum: 1,
    maximum: 350,
    description: 'Image width in pixels',
    examples: [300],
  }),
  height: Type.Integer({
    minimum: 1,
    maximum: 450,
    description: 'Image height in pixels',
    examples: [400],
  }),
  ownerId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Owner user ID (null for orphaned images)',
  }),
  visibility: VisibilitySchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const ImageUploadSchema = Type.Object({
  file: Type.String({
    format: 'binary',
    description: 'Image file (JPEG, PNG, or WebP, max 5MB)',
  }),
  description: Type.Optional(DescriptionSchema),
  visibility: Type.Optional(VisibilitySchema),
})

export const UpdateImageSchema = Type.Object({
  description: Type.Optional(DescriptionSchema),
  visibility: Type.Optional(VisibilitySchema),
})

// ============================================================================
// TAG SCHEMAS
// ============================================================================

export const TagResponseSchema = Type.Object({
  id: UUIDSchema,
  name: Type.String({
    minLength: 1,
    maxLength: 50,
    description: 'Unique tag name',
    examples: ['warrior', 'magic-user'],
  }),
  description: Type.Union([DescriptionSchema, Type.Null()], {
    description: 'Tag description',
  }),
  ownerId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Owner user ID (null for orphaned tags)',
  }),
  visibility: VisibilitySchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreateTagSchema = Type.Object({
  name: Type.String({
    minLength: 1,
    maxLength: 50,
    description: 'Unique tag name',
    examples: ['warrior'],
  }),
  description: Type.Optional(DescriptionSchema),
  visibility: Type.Optional(VisibilitySchema),
})

export const UpdateTagSchema = Type.Object({
  name: Type.Optional(
    Type.String({
      minLength: 1,
      maxLength: 50,
      description: 'Updated tag name',
    }),
  ),
  description: Type.Optional(DescriptionSchema),
  visibility: Type.Optional(VisibilitySchema),
})

// ============================================================================
// RACE SCHEMAS
// ============================================================================

export const RaceResponseSchema = Type.Object({
  id: UUIDSchema,
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique race name',
    examples: ['Elf', 'Dwarf', 'Human'],
  }),
  description: Type.Union([DescriptionSchema, Type.Null()], {
    description: 'Race description',
  }),
  // Attribute modifiers
  healthModifier: Type.Integer({
    description: 'Health percentage modifier (100 = no change)',
    examples: [120],
  }),
  manaModifier: Type.Integer({
    description: 'Mana percentage modifier (100 = no change)',
    examples: [150],
  }),
  staminaModifier: Type.Integer({
    description: 'Stamina percentage modifier (100 = no change)',
    examples: [90],
  }),
  strengthModifier: Type.Integer({
    description: 'Strength attribute modifier',
    examples: [12],
  }),
  constitutionModifier: Type.Integer({
    description: 'Constitution attribute modifier',
    examples: [8],
  }),
  dexterityModifier: Type.Integer({
    description: 'Dexterity attribute modifier',
    examples: [15],
  }),
  intelligenceModifier: Type.Integer({
    description: 'Intelligence attribute modifier',
    examples: [10],
  }),
  wisdomModifier: Type.Integer({
    description: 'Wisdom attribute modifier',
    examples: [13],
  }),
  charismaModifier: Type.Integer({
    description: 'Charisma attribute modifier',
    examples: [11],
  }),
  imageId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Race image ID',
  }),
  ownerId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Owner user ID (null for orphaned races)',
  }),
  visibility: VisibilitySchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreateRaceSchema = Type.Object({
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique race name',
    examples: ['Elf'],
  }),
  description: Type.Optional(DescriptionSchema),
  healthModifier: Type.Optional(
    Type.Integer({
      minimum: 50,
      maximum: 200,
      default: 100,
      description: 'Health percentage modifier',
    }),
  ),
  manaModifier: Type.Optional(
    Type.Integer({
      minimum: 50,
      maximum: 200,
      default: 100,
      description: 'Mana percentage modifier',
    }),
  ),
  staminaModifier: Type.Optional(
    Type.Integer({
      minimum: 50,
      maximum: 200,
      default: 100,
      description: 'Stamina percentage modifier',
    }),
  ),
  strengthModifier: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 30,
      default: 10,
      description: 'Strength attribute modifier',
    }),
  ),
  constitutionModifier: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 30,
      default: 10,
      description: 'Constitution attribute modifier',
    }),
  ),
  dexterityModifier: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 30,
      default: 10,
      description: 'Dexterity attribute modifier',
    }),
  ),
  intelligenceModifier: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 30,
      default: 10,
      description: 'Intelligence attribute modifier',
    }),
  ),
  wisdomModifier: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 30,
      default: 10,
      description: 'Wisdom attribute modifier',
    }),
  ),
  charismaModifier: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 30,
      default: 10,
      description: 'Charisma attribute modifier',
    }),
  ),
  imageId: Type.Optional(UUIDSchema),
  visibility: Type.Optional(VisibilitySchema),
})

// ============================================================================
// SKILL SCHEMAS
// ============================================================================

export const SkillResponseSchema = Type.Object({
  id: UUIDSchema,
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique skill name',
    examples: ['Swordsmanship', 'Fireball', 'Stealth'],
  }),
  description: Type.Union([DescriptionSchema, Type.Null()], {
    description: 'Skill description',
  }),
  requiredLevel: Type.Integer({
    minimum: 1,
    maximum: 100,
    description: 'Minimum character level required',
    examples: [5],
  }),
  imageId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Skill image ID',
  }),
  ownerId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Owner user ID (null for orphaned skills)',
  }),
  visibility: VisibilitySchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreateSkillSchema = Type.Object({
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique skill name',
    examples: ['Swordsmanship'],
  }),
  description: Type.Optional(DescriptionSchema),
  requiredLevel: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 100,
      default: 1,
      description: 'Minimum character level required',
    }),
  ),
  imageId: Type.Optional(UUIDSchema),
  visibility: Type.Optional(VisibilitySchema),
})

// ============================================================================
// PERK SCHEMAS
// ============================================================================

export const PerkResponseSchema = Type.Object({
  id: UUIDSchema,
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique perk name',
    examples: ['Iron Will', 'Eagle Eye', 'Quick Reflexes'],
  }),
  description: Type.Union([DescriptionSchema, Type.Null()], {
    description: 'Perk description',
  }),
  requiredLevel: Type.Integer({
    minimum: 0,
    maximum: 100,
    description: 'Minimum character level required',
    examples: [10],
  }),
  imageId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Perk image ID',
  }),
  ownerId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Owner user ID (null for orphaned perks)',
  }),
  visibility: VisibilitySchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreatePerkSchema = Type.Object({
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique perk name',
    examples: ['Iron Will'],
  }),
  description: Type.Optional(DescriptionSchema),
  requiredLevel: Type.Optional(
    Type.Integer({
      minimum: 0,
      maximum: 100,
      default: 0,
      description: 'Minimum character level required',
    }),
  ),
  imageId: Type.Optional(UUIDSchema),
  visibility: Type.Optional(VisibilitySchema),
})

// ============================================================================
// ARCHETYPE SCHEMAS
// ============================================================================

export const ArchetypeResponseSchema = Type.Object({
  id: UUIDSchema,
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique archetype name',
    examples: ['Warrior', 'Mage', 'Rogue'],
  }),
  description: Type.Union([DescriptionSchema, Type.Null()], {
    description: 'Archetype description',
  }),
  imageId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Archetype image ID',
  }),
  ownerId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Owner user ID (null for orphaned archetypes)',
  }),
  visibility: VisibilitySchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreateArchetypeSchema = Type.Object({
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique archetype name',
    examples: ['Warrior'],
  }),
  description: Type.Optional(DescriptionSchema),
  imageId: Type.Optional(UUIDSchema),
  visibility: Type.Optional(VisibilitySchema),
})

// ============================================================================
// ITEM SCHEMAS
// ============================================================================

export const ItemResponseSchema = Type.Object({
  id: UUIDSchema,
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique item name',
    examples: ['Excalibur', 'Health Potion', 'Leather Armor'],
  }),
  description: Type.Union([DescriptionSchema, Type.Null()], {
    description: 'Item description',
  }),
  // Attribute bonuses
  bonusHealth: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Health bonus granted by item',
  }),
  bonusMana: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Mana bonus granted by item',
  }),
  bonusStamina: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Stamina bonus granted by item',
  }),
  bonusStrength: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Strength bonus granted by item',
  }),
  bonusConstitution: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Constitution bonus granted by item',
  }),
  bonusDexterity: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Dexterity bonus granted by item',
  }),
  bonusIntelligence: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Intelligence bonus granted by item',
  }),
  bonusWisdom: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Wisdom bonus granted by item',
  }),
  bonusCharisma: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Charisma bonus granted by item',
  }),
  // Combat stats
  damage: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Damage value for weapons',
  }),
  defense: Type.Union([Type.Integer(), Type.Null()], {
    description: 'Defense value for armor',
  }),
  // Item properties
  rarity: RaritySchema,
  slot: SlotSchema,
  requiredLevel: Type.Integer({
    minimum: 1,
    maximum: 100,
    description: 'Minimum level required to use item',
    examples: [15],
  }),
  weight: Type.Number({
    minimum: 0,
    description: 'Item weight',
    examples: [2.5],
  }),
  durability: Type.Integer({
    minimum: 0,
    description: 'Current durability',
    examples: [95],
  }),
  maxDurability: Type.Integer({
    minimum: 1,
    description: 'Maximum durability',
    examples: [100],
  }),
  value: Type.Integer({
    minimum: 0,
    description: 'Item value in gold',
    examples: [250],
  }),
  // Item flags
  is2Handed: Type.Boolean({
    description: 'Whether item requires two hands',
    examples: [false],
  }),
  isThrowable: Type.Boolean({
    description: 'Whether item can be thrown',
    examples: [false],
  }),
  isConsumable: Type.Boolean({
    description: 'Whether item is consumed on use',
    examples: [false],
  }),
  isQuestItem: Type.Boolean({
    description: 'Whether item is a quest item',
    examples: [false],
  }),
  isTradeable: Type.Boolean({
    description: 'Whether item can be traded',
    examples: [true],
  }),
  imageId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Item image ID',
  }),
  ownerId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Owner user ID (null for orphaned items)',
  }),
  visibility: VisibilitySchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreateItemSchema = Type.Object({
  name: Type.String({
    minLength: 1,
    maxLength: 100,
    description: 'Unique item name',
    examples: ['Excalibur'],
  }),
  description: Type.Optional(DescriptionSchema),
  bonusHealth: Type.Optional(Type.Integer()),
  bonusMana: Type.Optional(Type.Integer()),
  bonusStamina: Type.Optional(Type.Integer()),
  bonusStrength: Type.Optional(Type.Integer()),
  bonusConstitution: Type.Optional(Type.Integer()),
  bonusDexterity: Type.Optional(Type.Integer()),
  bonusIntelligence: Type.Optional(Type.Integer()),
  bonusWisdom: Type.Optional(Type.Integer()),
  bonusCharisma: Type.Optional(Type.Integer()),
  damage: Type.Optional(Type.Integer({ minimum: 0 })),
  defense: Type.Optional(Type.Integer({ minimum: 0 })),
  rarity: Type.Optional(RaritySchema),
  slot: Type.Optional(SlotSchema),
  requiredLevel: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 100,
      default: 1,
    }),
  ),
  weight: Type.Optional(
    Type.Number({
      minimum: 0,
      default: 1.0,
    }),
  ),
  durability: Type.Optional(
    Type.Integer({
      minimum: 0,
      default: 100,
    }),
  ),
  maxDurability: Type.Optional(
    Type.Integer({
      minimum: 1,
      default: 100,
    }),
  ),
  value: Type.Optional(
    Type.Integer({
      minimum: 0,
      default: 0,
    }),
  ),
  is2Handed: Type.Optional(Type.Boolean({ default: false })),
  isThrowable: Type.Optional(Type.Boolean({ default: false })),
  isConsumable: Type.Optional(Type.Boolean({ default: false })),
  isQuestItem: Type.Optional(Type.Boolean({ default: false })),
  isTradeable: Type.Optional(Type.Boolean({ default: true })),
  imageId: Type.Optional(UUIDSchema),
  visibility: Type.Optional(VisibilitySchema),
})

// ============================================================================
// CHARACTER SCHEMAS
// ============================================================================

export const CharacterResponseSchema = Type.Object({
  id: UUIDSchema,
  name: Type.String({
    minLength: 2,
    maxLength: 100,
    description: 'Unique character name',
    examples: ['Aragorn'],
  }),
  sex: SexSchema,
  age: Type.Integer({
    minimum: 1,
    maximum: 10000,
    description: 'Character age',
    examples: [25],
  }),
  description: Type.Union([DescriptionSchema, Type.Null()], {
    description: 'Character description',
  }),
  level: Type.Integer({
    minimum: 1,
    maximum: 100,
    description: 'Character level',
    examples: [15],
  }),
  experience: Type.Integer({
    minimum: 0,
    description: 'Character experience points',
    examples: [12500],
  }),
  // Core attributes
  health: Type.Integer({
    minimum: 1,
    description: 'Character health points',
    examples: [150],
  }),
  mana: Type.Integer({
    minimum: 0,
    description: 'Character mana points',
    examples: [120],
  }),
  stamina: Type.Integer({
    minimum: 0,
    description: 'Character stamina points',
    examples: [100],
  }),
  // Primary attributes
  strength: Type.Integer({
    minimum: 1,
    maximum: 30,
    description: 'Strength attribute',
    examples: [18],
  }),
  constitution: Type.Integer({
    minimum: 1,
    maximum: 30,
    description: 'Constitution attribute',
    examples: [16],
  }),
  dexterity: Type.Integer({
    minimum: 1,
    maximum: 30,
    description: 'Dexterity attribute',
    examples: [14],
  }),
  intelligence: Type.Integer({
    minimum: 1,
    maximum: 30,
    description: 'Intelligence attribute',
    examples: [12],
  }),
  wisdom: Type.Integer({
    minimum: 1,
    maximum: 30,
    description: 'Wisdom attribute',
    examples: [13],
  }),
  charisma: Type.Integer({
    minimum: 1,
    maximum: 30,
    description: 'Charisma attribute',
    examples: [15],
  }),
  // Required relationships
  raceId: UUIDSchema,
  archetypeId: UUIDSchema,
  // Optional relationships
  imageId: Type.Union([UUIDSchema, Type.Null()], {
    description: 'Character image ID',
  }),
  ownerId: UUIDSchema,
  visibility: VisibilitySchema,
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const CreateCharacterSchema = Type.Object({
  name: Type.String({
    minLength: 2,
    maxLength: 100,
    description: 'Character name (must be unique)',
    examples: ['Aragorn'],
  }),
  sex: Type.Optional(SexSchema),
  age: Type.Optional(
    Type.Integer({
      minimum: 16,
      maximum: 1000,
      default: 18,
      description: 'Character age',
    }),
  ),
  description: Type.Optional(DescriptionSchema),
  raceId: UUIDSchema,
  archetypeId: UUIDSchema,
  level: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 100,
      default: 1,
    }),
  ),
  experience: Type.Optional(
    Type.Integer({
      minimum: 0,
      default: 0,
    }),
  ),
  strength: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 20,
      default: 10,
    }),
  ),
  constitution: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 20,
      default: 10,
    }),
  ),
  dexterity: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 20,
      default: 10,
    }),
  ),
  intelligence: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 20,
      default: 10,
    }),
  ),
  wisdom: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 20,
      default: 10,
    }),
  ),
  charisma: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 20,
      default: 10,
    }),
  ),
  imageId: Type.Optional(UUIDSchema),
  skillIds: Type.Optional(
    Type.Array(UUIDSchema, {
      maxItems: 20,
      description: 'Array of skill IDs',
    }),
  ),
  perkIds: Type.Optional(
    Type.Array(UUIDSchema, {
      maxItems: 20,
      description: 'Array of perk IDs',
    }),
  ),
  tagIds: Type.Optional(
    Type.Array(UUIDSchema, {
      maxItems: 10,
      description: 'Array of tag IDs',
    }),
  ),
  visibility: Type.Optional(VisibilitySchema),
})

// ============================================================================
// EQUIPMENT SCHEMAS
// ============================================================================

export const EquipmentResponseSchema = Type.Object({
  id: UUIDSchema,
  characterId: UUIDSchema,
  // Equipment slots
  headId: Type.Union([UUIDSchema, Type.Null()]),
  faceId: Type.Union([UUIDSchema, Type.Null()]),
  chestId: Type.Union([UUIDSchema, Type.Null()]),
  legsId: Type.Union([UUIDSchema, Type.Null()]),
  feetId: Type.Union([UUIDSchema, Type.Null()]),
  handsId: Type.Union([UUIDSchema, Type.Null()]),
  rightHandId: Type.Union([UUIDSchema, Type.Null()]),
  leftHandId: Type.Union([UUIDSchema, Type.Null()]),
  rightRingId: Type.Union([UUIDSchema, Type.Null()]),
  leftRingId: Type.Union([UUIDSchema, Type.Null()]),
  amuletId: Type.Union([UUIDSchema, Type.Null()]),
  beltId: Type.Union([UUIDSchema, Type.Null()]),
  backpackId: Type.Union([UUIDSchema, Type.Null()]),
  cloakId: Type.Union([UUIDSchema, Type.Null()]),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
})

export const UpdateEquipmentSchema = Type.Object({
  headId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  faceId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  chestId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  legsId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  feetId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  handsId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  rightHandId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  leftHandId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  rightRingId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  leftRingId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  amuletId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  beltId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  backpackId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
  cloakId: Type.Optional(Type.Union([UUIDSchema, Type.Null()])),
})

// ============================================================================
// STATISTICS SCHEMAS
// ============================================================================

export const StatsResponseSchema = Type.Object({
  totalCount: Type.Integer({
    minimum: 0,
    description: 'Total number of items',
    examples: [150],
  }),
  byVisibility: Type.Record(Type.String(), Type.Integer(), {
    description: 'Count by visibility level',
  }),
  byOwnership: Type.Array(
    Type.Object({
      ownerId: Type.Union([UUIDSchema, Type.Null()]),
      count: Type.Integer({ minimum: 0 }),
    }),
    { description: 'Count by ownership' },
  ),
  createdToday: Type.Integer({
    minimum: 0,
    description: 'Items created today',
  }),
  createdThisWeek: Type.Integer({
    minimum: 0,
    description: 'Items created this week',
  }),
  createdThisMonth: Type.Integer({
    minimum: 0,
    description: 'Items created this month',
  }),
})

// ============================================================================
// SUCCESS MESSAGE SCHEMAS
// ============================================================================

export const SuccessMessageSchema = Type.Object({
  message: Type.String({
    description: 'Success message',
    examples: ['Operation completed successfully'],
  }),
})

export const DeleteSuccessSchema = Type.Object({
  message: Type.String({
    description: 'Deletion success message',
    examples: ['Resource deleted successfully'],
  }),
})

// ============================================================================
// HEALTH CHECK SCHEMAS
// ============================================================================

export const HealthCheckResponseSchema = Type.Object({
  status: Type.String({
    enum: ['ok', 'error'],
    description: 'Health check status',
    examples: ['ok'],
  }),
  timestamp: TimestampSchema,
  uptime: Type.Number({
    description: 'Server uptime in seconds',
    examples: [3600],
  }),
  version: Type.String({
    description: 'API version',
    examples: ['1.0.0'],
  }),
  environment: Type.String({
    description: 'Current environment',
    examples: ['development'],
  }),
  database: Type.Object({
    status: Type.String({
      enum: ['connected', 'disconnected', 'error'],
      description: 'Database connection status',
      examples: ['connected'],
    }),
    responseTime: Type.Number({
      description: 'Database response time in milliseconds',
      examples: [25],
    }),
  }),
})

// ============================================================================
// CACHE HEADERS SCHEMAS
// ============================================================================

export const CacheHeadersSchema = Type.Object({
  'cache-control': Type.Optional(
    Type.String({
      description: 'Cache control directives',
      examples: ['public, max-age=300'],
    }),
  ),
  etag: Type.Optional(
    Type.String({
      description: 'Entity tag for cache validation',
      examples: ['"abc123def456"'],
    }),
  ),
  'last-modified': Type.Optional(
    Type.String({
      description: 'Last modified date',
      examples: ['Wed, 21 Oct 2015 07:28:00 GMT'],
    }),
  ),
  age: Type.Optional(
    Type.Integer({
      description: 'Age of cached response in seconds',
      examples: [120],
    }),
  ),
})
