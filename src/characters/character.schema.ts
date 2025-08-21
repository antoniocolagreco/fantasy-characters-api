/**
 * Character validation schemas using TypeBox
 * Defines input validation and serialization schemas for character endpoints
 */

import { Type } from '@sinclair/typebox'
import { CHARACTER_DEFAULTS } from '../shared/constants'

// Visibility enum values
const VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const

// Sex enum values
const SEX_VALUES = ['MALE', 'FEMALE'] as const

// Simple related entity schemas for responses
const SimpleImageSchema = Type.Object({
  id: Type.String(),
  filename: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
})

const SimpleRaceSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  // Include modifiers for character creation calculations
  healthModifier: Type.Number(),
  manaModifier: Type.Number(),
  staminaModifier: Type.Number(),
  strengthModifier: Type.Number(),
  constitutionModifier: Type.Number(),
  dexterityModifier: Type.Number(),
  intelligenceModifier: Type.Number(),
  wisdomModifier: Type.Number(),
  charismaModifier: Type.Number(),
})

const SimpleArchetypeSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
})

const SimpleSkillSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  requiredLevel: Type.Number(),
})

const SimplePerkSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  requiredLevel: Type.Number(),
})

const SimpleTagSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
})

const SimpleItemSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  rarity: Type.String(),
  slot: Type.String(),
})

const SimpleEquipmentSchema = Type.Object({
  id: Type.String(),
  characterId: Type.String(),
  head: Type.Union([SimpleItemSchema, Type.Null()]),
  face: Type.Union([SimpleItemSchema, Type.Null()]),
  chest: Type.Union([SimpleItemSchema, Type.Null()]),
  legs: Type.Union([SimpleItemSchema, Type.Null()]),
  feet: Type.Union([SimpleItemSchema, Type.Null()]),
  hands: Type.Union([SimpleItemSchema, Type.Null()]),
  rightHand: Type.Union([SimpleItemSchema, Type.Null()]),
  leftHand: Type.Union([SimpleItemSchema, Type.Null()]),
  rightRing: Type.Union([SimpleItemSchema, Type.Null()]),
  leftRing: Type.Union([SimpleItemSchema, Type.Null()]),
  amulet: Type.Union([SimpleItemSchema, Type.Null()]),
  belt: Type.Union([SimpleItemSchema, Type.Null()]),
  backpack: Type.Union([SimpleItemSchema, Type.Null()]),
  cloak: Type.Union([SimpleItemSchema, Type.Null()]),
})

const SimpleUserSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  name: Type.Union([Type.String(), Type.Null()]),
})

// Base character response schema
export const CharacterResponseSchema = Type.Object(
  {
    id: Type.String({ description: 'Character ID' }),
    name: Type.String({ description: 'Character name (unique)' }),
    sex: Type.String({
      enum: SEX_VALUES,
      description: 'Character sex',
    }),
    age: Type.Number({
      minimum: 1,
      maximum: 10000,
      description: 'Character age',
    }),
    description: Type.Union([Type.String(), Type.Null()], {
      description: 'Character description',
    }),
    level: Type.Number({
      minimum: 1,
      maximum: 100,
      description: 'Character level',
    }),
    experience: Type.Number({
      minimum: 0,
      description: 'Character experience points',
    }),

    // Core attributes
    health: Type.Number({
      minimum: 1,
      description: 'Character health points',
    }),
    mana: Type.Number({
      minimum: 0,
      description: 'Character mana points',
    }),
    stamina: Type.Number({
      minimum: 0,
      description: 'Character stamina points',
    }),

    // Primary attributes
    strength: Type.Number({
      minimum: 1,
      maximum: 30,
      description: 'Strength attribute',
    }),
    constitution: Type.Number({
      minimum: 1,
      maximum: 30,
      description: 'Constitution attribute',
    }),
    dexterity: Type.Number({
      minimum: 1,
      maximum: 30,
      description: 'Dexterity attribute',
    }),
    intelligence: Type.Number({
      minimum: 1,
      maximum: 30,
      description: 'Intelligence attribute',
    }),
    wisdom: Type.Number({
      minimum: 1,
      maximum: 30,
      description: 'Wisdom attribute',
    }),
    charisma: Type.Number({
      minimum: 1,
      maximum: 30,
      description: 'Charisma attribute',
    }),

    // Required relationships
    raceId: Type.String({ description: 'Race ID' }),
    race: Type.Optional(SimpleRaceSchema),
    archetypeId: Type.String({ description: 'Archetype ID' }),
    archetype: Type.Optional(SimpleArchetypeSchema),

    // Optional relationships
    imageId: Type.Union([Type.String(), Type.Null()], {
      description: 'Character image ID',
    }),
    image: Type.Union([SimpleImageSchema, Type.Null()], {
      description: 'Character image',
    }),

    // Collections
    skills: Type.Optional(Type.Array(SimpleSkillSchema)),
    perks: Type.Optional(Type.Array(SimplePerkSchema)),
    tags: Type.Optional(Type.Array(SimpleTagSchema)),
    inventory: Type.Optional(Type.Array(SimpleItemSchema)),
    equipment: Type.Optional(Type.Union([SimpleEquipmentSchema, Type.Null()])),

    // Owner and metadata
    ownerId: Type.String({ description: 'Owner user ID' }),
    owner: Type.Optional(SimpleUserSchema),
    visibility: Type.String({
      enum: VISIBILITY_VALUES,
      description: 'Character visibility level',
    }),
    createdAt: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
    updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
  },
  {
    $id: 'CharacterResponse',
    description: 'Character response schema',
  },
)

// Create character request schema
export const CreateCharacterSchema = Type.Object(
  {
    name: Type.String({
      minLength: 2,
      maxLength: 100,
      description: 'Character name (must be unique)',
      examples: ['Aragorn', 'Legolas', 'Gimli'],
    }),
    sex: Type.Optional(
      Type.String({
        enum: SEX_VALUES,
        default: 'MALE',
        description: 'Character sex',
      }),
    ),
    age: Type.Optional(
      Type.Number({
        minimum: 16,
        maximum: 1000,
        default: 18,
        description: 'Character age',
      }),
    ),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Character background and description',
        examples: ['A brave warrior from the north', 'An elven ranger with keen eyes'],
      }),
    ),

    // Required relationships
    raceId: Type.String({
      format: 'uuid',
      description: 'ID of the character race',
    }),
    archetypeId: Type.String({
      format: 'uuid',
      description: 'ID of the character archetype/class',
    }),

    // Optional character customization
    level: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        default: CHARACTER_DEFAULTS.LEVEL,
        description: 'Starting character level',
      }),
    ),
    experience: Type.Optional(
      Type.Number({
        minimum: 0,
        default: CHARACTER_DEFAULTS.EXPERIENCE,
        description: 'Starting experience points',
      }),
    ),

    // Custom attribute values (will be combined with race modifiers)
    strength: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: CHARACTER_DEFAULTS.STRENGTH,
        description: 'Base strength (before race modifiers)',
      }),
    ),
    constitution: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: CHARACTER_DEFAULTS.CONSTITUTION,
        description: 'Base constitution (before race modifiers)',
      }),
    ),
    dexterity: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: CHARACTER_DEFAULTS.DEXTERITY,
        description: 'Base dexterity (before race modifiers)',
      }),
    ),
    intelligence: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: CHARACTER_DEFAULTS.INTELLIGENCE,
        description: 'Base intelligence (before race modifiers)',
      }),
    ),
    wisdom: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: CHARACTER_DEFAULTS.WISDOM,
        description: 'Base wisdom (before race modifiers)',
      }),
    ),
    charisma: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: CHARACTER_DEFAULTS.CHARISMA,
        description: 'Base charisma (before race modifiers)',
      }),
    ),

    // Optional relationships
    imageId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'ID of character image',
      }),
    ),
    skillIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        description: 'Array of skill IDs to assign to character',
        maxItems: 20,
      }),
    ),
    perkIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        description: 'Array of perk IDs to assign to character',
        maxItems: 20,
      }),
    ),
    tagIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        description: 'Array of tag IDs to assign to character',
        maxItems: 10,
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        default: 'PUBLIC',
        description: 'Character visibility level',
      }),
    ),
  },
  {
    $id: 'CreateCharacter',
    description: 'Create character request schema',
    required: ['name', 'raceId', 'archetypeId'],
    additionalProperties: false,
  },
)

// Update character request schema
export const UpdateCharacterSchema = Type.Object(
  {
    name: Type.Optional(
      Type.String({
        minLength: 2,
        maxLength: 100,
        description: 'Updated character name',
      }),
    ),
    sex: Type.Optional(
      Type.String({
        enum: SEX_VALUES,
        description: 'Updated character sex',
      }),
    ),
    age: Type.Optional(
      Type.Number({
        minimum: 16,
        maximum: 1000,
        description: 'Updated character age',
      }),
    ),
    description: Type.Optional(
      Type.String({
        maxLength: 2000,
        description: 'Updated character description',
      }),
    ),
    level: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        description: 'Updated character level',
      }),
    ),
    experience: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Updated experience points',
      }),
    ),

    // Core attributes (recalculated from base + race modifiers)
    health: Type.Optional(
      Type.Number({
        minimum: 1,
        description: 'Updated health points',
      }),
    ),
    mana: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Updated mana points',
      }),
    ),
    stamina: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Updated stamina points',
      }),
    ),

    // Primary attributes (will trigger recalculation)
    strength: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 30,
        description: 'Updated strength attribute',
      }),
    ),
    constitution: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 30,
        description: 'Updated constitution attribute',
      }),
    ),
    dexterity: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 30,
        description: 'Updated dexterity attribute',
      }),
    ),
    intelligence: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 30,
        description: 'Updated intelligence attribute',
      }),
    ),
    wisdom: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 30,
        description: 'Updated wisdom attribute',
      }),
    ),
    charisma: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 30,
        description: 'Updated charisma attribute',
      }),
    ),

    // Relationship updates
    raceId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Updated race ID (triggers stat recalculation)',
      }),
    ),
    archetypeId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Updated archetype ID',
      }),
    ),
    imageId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Updated character image ID',
      }),
    ),
    skillIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        description: 'Updated array of skill IDs',
        maxItems: 20,
      }),
    ),
    perkIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        description: 'Updated array of perk IDs',
        maxItems: 20,
      }),
    ),
    tagIds: Type.Optional(
      Type.Array(Type.String({ format: 'uuid' }), {
        description: 'Updated array of tag IDs',
        maxItems: 10,
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Updated visibility level',
      }),
    ),
  },
  {
    $id: 'UpdateCharacter',
    description: 'Update character request schema',
    additionalProperties: false,
  },
)

// List characters query schema
export const ListCharactersQuerySchema = Type.Object(
  {
    // Pagination - these come as strings from query params
    page: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        default: '1',
        description: 'Page number (string)',
      }),
    ),
    limit: Type.Optional(
      Type.String({
        pattern: '^([1-9]|[1-9]\\d|100)$',
        default: '20',
        description: 'Items per page (string, max 100)',
      }),
    ),

    // Filtering by IDs
    raceId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by race ID',
      }),
    ),
    archetypeId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by archetype ID',
      }),
    ),
    ownerId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by owner ID',
      }),
    ),
    skillId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by characters having specific skill',
      }),
    ),
    perkId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by characters having specific perk',
      }),
    ),
    tagId: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'Filter by characters having specific tag',
      }),
    ),

    // Filtering by attributes - all come as strings from query params
    minLevel: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by minimum level (string number)',
      }),
    ),
    maxLevel: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by maximum level (string number)',
      }),
    ),
    sex: Type.Optional(
      Type.String({
        enum: SEX_VALUES,
        description: 'Filter by character sex',
      }),
    ),
    minAge: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by minimum age (string number)',
      }),
    ),
    maxAge: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by maximum age (string number)',
      }),
    ),

    // Stat filtering - all string numbers
    minStrength: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by minimum strength (string number)',
      }),
    ),
    maxStrength: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by maximum strength (string number)',
      }),
    ),
    minIntelligence: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by minimum intelligence (string number)',
      }),
    ),
    maxIntelligence: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by maximum intelligence (string number)',
      }),
    ),

    // Visibility and ownership
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Filter by visibility level',
      }),
    ),
    includeOrphaned: Type.Optional(
      Type.String({
        enum: ['true', 'false'],
        default: 'false',
        description: 'Include characters with null ownerId (string boolean)',
      }),
    ),

    // Search
    search: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Search characters by name or description',
      }),
    ),

    // Include related data
    includeRelations: Type.Optional(
      Type.String({
        enum: ['true', 'false'],
        default: 'false',
        description: 'Include race, archetype, and other related data (string boolean)',
      }),
    ),

    // Sorting options
    sortBy: Type.Optional(
      Type.String({
        enum: [
          'name',
          'level',
          'age',
          'experience',
          'health',
          'mana',
          'stamina',
          'strength',
          'constitution',
          'dexterity',
          'intelligence',
          'wisdom',
          'charisma',
          'createdAt',
          'updatedAt',
        ],
        default: 'createdAt',
        description: 'Field to sort by',
      }),
    ),
    sortOrder: Type.Optional(
      Type.String({
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort order (ascending or descending)',
      }),
    ),

    // Enhanced attribute filtering
    minConstitution: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by minimum constitution (string number)',
      }),
    ),
    maxConstitution: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by maximum constitution (string number)',
      }),
    ),
    minDexterity: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by minimum dexterity (string number)',
      }),
    ),
    maxDexterity: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by maximum dexterity (string number)',
      }),
    ),
    minWisdom: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by minimum wisdom (string number)',
      }),
    ),
    maxWisdom: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by maximum wisdom (string number)',
      }),
    ),
    minCharisma: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by minimum charisma (string number)',
      }),
    ),
    maxCharisma: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by maximum charisma (string number)',
      }),
    ),
    minHealth: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by minimum health (string number)',
      }),
    ),
    maxHealth: Type.Optional(
      Type.String({
        pattern: '^[1-9]\\d*$',
        description: 'Filter by maximum health (string number)',
      }),
    ),
    minMana: Type.Optional(
      Type.String({
        pattern: '^\\d+$',
        description: 'Filter by minimum mana (string number)',
      }),
    ),
    maxMana: Type.Optional(
      Type.String({
        pattern: '^\\d+$',
        description: 'Filter by maximum mana (string number)',
      }),
    ),
    minStamina: Type.Optional(
      Type.String({
        pattern: '^\\d+$',
        description: 'Filter by minimum stamina (string number)',
      }),
    ),
    maxStamina: Type.Optional(
      Type.String({
        pattern: '^\\d+$',
        description: 'Filter by maximum stamina (string number)',
      }),
    ),
    minExperience: Type.Optional(
      Type.String({
        pattern: '^\\d+$',
        description: 'Filter by minimum experience (string number)',
      }),
    ),
    maxExperience: Type.Optional(
      Type.String({
        pattern: '^\\d+$',
        description: 'Filter by maximum experience (string number)',
      }),
    ),
  },
  {
    $id: 'ListCharactersQuery',
    description: 'Query parameters for listing characters',
    additionalProperties: false,
  },
)

// List characters response schema
export const ListCharactersResponseSchema = Type.Object(
  {
    characters: Type.Array(CharacterResponseSchema, {
      description: 'Array of characters',
    }),
    total: Type.Number({ description: 'Total number of characters' }),
    page: Type.Number({ description: 'Current page number' }),
    limit: Type.Number({ description: 'Items per page' }),
    totalPages: Type.Number({ description: 'Total number of pages' }),
  },
  {
    $id: 'ListCharactersResponse',
    description: 'List characters response schema',
  },
)

// Character statistics schema
export const CharacterStatsSchema = Type.Object(
  {
    totalCount: Type.Number({ description: 'Total number of characters' }),

    // Visibility breakdown
    byVisibility: Type.Record(Type.String(), Type.Number(), {
      description: 'Count by visibility level',
    }),

    // Ownership breakdown
    byOwnership: Type.Array(
      Type.Object({
        ownerId: Type.Union([Type.String(), Type.Null()], {
          description: 'Owner ID or null for orphaned',
        }),
        count: Type.Number({ description: 'Number of characters' }),
      }),
      { description: 'Count by ownership' },
    ),

    // Level distribution
    levelDistribution: Type.Record(Type.Number(), Type.Number(), {
      description: 'Distribution by character level',
    }),
    averageLevel: Type.Number({ description: 'Average character level' }),

    // Sex distribution
    sexDistribution: Type.Object({
      MALE: Type.Number(),
      FEMALE: Type.Number(),
    }),

    // Race popularity
    raceDistribution: Type.Array(
      Type.Object({
        raceId: Type.String(),
        raceName: Type.String(),
        count: Type.Number(),
      }),
      { description: 'Most popular races' },
    ),

    // Archetype popularity
    archetypeDistribution: Type.Array(
      Type.Object({
        archetypeId: Type.String(),
        archetypeName: Type.String(),
        count: Type.Number(),
      }),
      { description: 'Most popular archetypes' },
    ),

    // Attribute statistics
    attributeAverages: Type.Object({
      strength: Type.Number(),
      constitution: Type.Number(),
      dexterity: Type.Number(),
      intelligence: Type.Number(),
      wisdom: Type.Number(),
      charisma: Type.Number(),
      health: Type.Number(),
      mana: Type.Number(),
      stamina: Type.Number(),
    }),

    // Age statistics
    ageStatistics: Type.Object({
      average: Type.Number(),
      median: Type.Number(),
      youngest: Type.Number(),
      oldest: Type.Number(),
    }),

    // Skills and perks distribution
    skillsDistribution: Type.Record(Type.Number(), Type.Number(), {
      description: 'Distribution by number of skills',
    }),
    perksDistribution: Type.Record(Type.Number(), Type.Number(), {
      description: 'Distribution by number of perks',
    }),
    averageSkillsPerCharacter: Type.Number(),
    averagePerksPerCharacter: Type.Number(),

    // Most popular skills and perks
    popularSkills: Type.Array(
      Type.Object({
        skillId: Type.String(),
        skillName: Type.String(),
        count: Type.Number(),
      }),
      { description: 'Most popular skills' },
    ),
    popularPerks: Type.Array(
      Type.Object({
        perkId: Type.String(),
        perkName: Type.String(),
        count: Type.Number(),
      }),
      { description: 'Most popular perks' },
    ),
  },
  {
    $id: 'CharacterStatsSchema',
    description: 'Character statistics response schema',
  },
)

// Request parameter schemas
export const CharacterParamSchema = Type.Object(
  {
    id: Type.String({
      format: 'uuid',
      description: 'Character ID',
    }),
  },
  {
    $id: 'CharacterParam',
    description: 'Character parameter schema',
    additionalProperties: false,
  },
)

// Error response schemas
export const CharacterNotFoundSchema = Type.Object({
  error: Type.String({ default: 'Not Found' }),
  message: Type.String({ default: 'Character not found' }),
  statusCode: Type.Number({ default: 404 }),
})

export const CharacterConflictSchema = Type.Object({
  error: Type.String({ default: 'Conflict' }),
  message: Type.String({ default: 'Character with this name already exists' }),
  statusCode: Type.Number({ default: 409 }),
})

export const CharacterForbiddenSchema = Type.Object({
  error: Type.String({ default: 'Forbidden' }),
  message: Type.String({ default: 'Insufficient permissions to access this character' }),
  statusCode: Type.Number({ default: 403 }),
})

export const CharacterBadRequestSchema = Type.Object({
  error: Type.String({ default: 'Bad Request' }),
  message: Type.String(),
  statusCode: Type.Number({ default: 400 }),
})
