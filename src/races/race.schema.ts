import { Type } from '@sinclair/typebox'

// Visibility enum values
const VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const

// Race schemas
export const raceSchema = Type.Object(
  {
    id: Type.String({ description: 'Unique race identifier' }),
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Race name (unique)',
      examples: ['Human', 'Elf', 'Dwarf', 'Halfling', 'Orc'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Optional race description',
        examples: [
          'Versatile and adaptable beings found in all corners of the world',
          'Graceful and long-lived forest dwellers with natural magical affinity',
        ],
      }),
    ),
    // Attribute modifiers
    healthModifier: Type.Number({
      minimum: 10,
      maximum: 200,
      default: 100,
      description: 'Health attribute modifier percentage',
      examples: [80, 100, 120],
    }),
    manaModifier: Type.Number({
      minimum: 10,
      maximum: 200,
      default: 100,
      description: 'Mana attribute modifier percentage',
      examples: [80, 100, 130],
    }),
    staminaModifier: Type.Number({
      minimum: 10,
      maximum: 200,
      default: 100,
      description: 'Stamina attribute modifier percentage',
      examples: [90, 100, 110],
    }),
    strengthModifier: Type.Number({
      minimum: 1,
      maximum: 20,
      default: 10,
      description: 'Strength attribute modifier',
      examples: [8, 10, 12],
    }),
    constitutionModifier: Type.Number({
      minimum: 1,
      maximum: 20,
      default: 10,
      description: 'Constitution attribute modifier',
      examples: [9, 10, 13],
    }),
    dexterityModifier: Type.Number({
      minimum: 1,
      maximum: 20,
      default: 10,
      description: 'Dexterity attribute modifier',
      examples: [8, 10, 14],
    }),
    intelligenceModifier: Type.Number({
      minimum: 1,
      maximum: 20,
      default: 10,
      description: 'Intelligence attribute modifier',
      examples: [9, 10, 12],
    }),
    wisdomModifier: Type.Number({
      minimum: 1,
      maximum: 20,
      default: 10,
      description: 'Wisdom attribute modifier',
      examples: [10, 11, 13],
    }),
    charismaModifier: Type.Number({
      minimum: 1,
      maximum: 20,
      default: 10,
      description: 'Charisma attribute modifier',
      examples: [8, 10, 12],
    }),
    imageId: Type.Optional(Type.String({ description: 'ID of the race image' })),
    ownerId: Type.Optional(Type.String({ description: 'ID of the user who created the race' })),
    visibility: Type.String({
      enum: VISIBILITY_VALUES,
      description: 'Race visibility level',
      default: 'PUBLIC',
    }),
    createdAt: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
    updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
  },
  { $id: 'Race' },
)

// Create race request schema
export const createRaceSchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Race name (must be unique)',
      examples: ['Human', 'Elf', 'Dwarf'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Optional race description',
      }),
    ),
    // Attribute modifiers - all optional with defaults
    healthModifier: Type.Optional(
      Type.Number({
        minimum: 10,
        maximum: 200,
        default: 100,
        description: 'Health attribute modifier percentage',
      }),
    ),
    manaModifier: Type.Optional(
      Type.Number({
        minimum: 10,
        maximum: 200,
        default: 100,
        description: 'Mana attribute modifier percentage',
      }),
    ),
    staminaModifier: Type.Optional(
      Type.Number({
        minimum: 10,
        maximum: 200,
        default: 100,
        description: 'Stamina attribute modifier percentage',
      }),
    ),
    strengthModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Strength attribute modifier',
      }),
    ),
    constitutionModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Constitution attribute modifier',
      }),
    ),
    dexterityModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Dexterity attribute modifier',
      }),
    ),
    intelligenceModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Intelligence attribute modifier',
      }),
    ),
    wisdomModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Wisdom attribute modifier',
      }),
    ),
    charismaModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        default: 10,
        description: 'Charisma attribute modifier',
      }),
    ),
    imageId: Type.Optional(
      Type.String({
        description: 'ID of the race image',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Race visibility level',
        default: 'PUBLIC',
      }),
    ),
  },
  { $id: 'CreateRace' },
)

// Update race request schema
export const updateRaceSchema = Type.Object(
  {
    name: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Updated race name',
      }),
    ),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Updated race description',
      }),
    ),
    // All attribute modifiers optional for updates
    healthModifier: Type.Optional(
      Type.Number({
        minimum: 10,
        maximum: 200,
        description: 'Updated health modifier percentage',
      }),
    ),
    manaModifier: Type.Optional(
      Type.Number({
        minimum: 10,
        maximum: 200,
        description: 'Updated mana modifier percentage',
      }),
    ),
    staminaModifier: Type.Optional(
      Type.Number({
        minimum: 10,
        maximum: 200,
        description: 'Updated stamina modifier percentage',
      }),
    ),
    strengthModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Updated strength modifier',
      }),
    ),
    constitutionModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Updated constitution modifier',
      }),
    ),
    dexterityModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Updated dexterity modifier',
      }),
    ),
    intelligenceModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Updated intelligence modifier',
      }),
    ),
    wisdomModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Updated wisdom modifier',
      }),
    ),
    charismaModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Updated charisma modifier',
      }),
    ),
    imageId: Type.Optional(
      Type.String({
        description: 'Updated race image ID',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Updated visibility level',
      }),
    ),
  },
  { $id: 'UpdateRace' },
)

// List races query schema
export const listRacesQuerySchema = Type.Object(
  {
    page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number' })),
    limit: Type.Optional(
      Type.Number({ minimum: 1, maximum: 100, default: 20, description: 'Items per page' }),
    ),
    strengthModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Filter by exact strength modifier',
      }),
    ),
    intelligenceModifier: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Filter by exact intelligence modifier',
      }),
    ),
    minStrength: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Filter by minimum strength modifier',
      }),
    ),
    maxStrength: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Filter by maximum strength modifier',
      }),
    ),
    minIntelligence: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Filter by minimum intelligence modifier',
      }),
    ),
    maxIntelligence: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 20,
        description: 'Filter by maximum intelligence modifier',
      }),
    ),
    search: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Search races by name or description',
      }),
    ),
  },
  { $id: 'ListRacesQuery' },
)

// List races response schema
export const listRacesResponseSchema = Type.Object(
  {
    races: Type.Array(raceSchema, { description: 'Array of races' }),
    total: Type.Number({ description: 'Total number of items' }),
    page: Type.Number({ description: 'Current page number' }),
    limit: Type.Number({ description: 'Items per page' }),
    totalPages: Type.Number({ description: 'Total number of pages' }),
  },
  { $id: 'ListRacesResponse' },
)

// Race statistics response schema
export const raceStatsResponseSchema = Type.Object(
  {
    totalRaces: Type.Number({ description: 'Total number of races' }),
    publicRaces: Type.Number({ description: 'Number of public races' }),
    privateRaces: Type.Number({ description: 'Number of private races' }),
    orphanedRaces: Type.Number({ description: 'Number of races with no owner' }),
    averageModifiers: Type.Object({
      health: Type.Number({ description: 'Average health modifier across all races' }),
      mana: Type.Number({ description: 'Average mana modifier across all races' }),
      stamina: Type.Number({ description: 'Average stamina modifier across all races' }),
      strength: Type.Number({ description: 'Average strength modifier across all races' }),
      constitution: Type.Number({ description: 'Average constitution modifier across all races' }),
      dexterity: Type.Number({ description: 'Average dexterity modifier across all races' }),
      intelligence: Type.Number({ description: 'Average intelligence modifier across all races' }),
      wisdom: Type.Number({ description: 'Average wisdom modifier across all races' }),
      charisma: Type.Number({ description: 'Average charisma modifier across all races' }),
    }),
    popularModifierRanges: Type.Object({
      highStrength: Type.Number({ description: 'Races with strength modifier ≥ 12' }),
      highIntelligence: Type.Number({ description: 'Races with intelligence modifier ≥ 12' }),
      highDexterity: Type.Number({ description: 'Races with dexterity modifier ≥ 12' }),
      highConstitution: Type.Number({ description: 'Races with constitution modifier ≥ 12' }),
      balanced: Type.Number({ description: 'Races with all modifiers between 9-11' }),
    }),
  },
  { $id: 'RaceStatsResponse' },
)

// Error response schemas
export const raceNotFoundSchema = Type.Object({
  error: Type.String({ default: 'Not Found' }),
  message: Type.String({ default: 'Race not found' }),
  statusCode: Type.Number({ default: 404 }),
})

export const raceConflictSchema = Type.Object({
  error: Type.String({ default: 'Conflict' }),
  message: Type.String({ default: 'Race with this name already exists' }),
  statusCode: Type.Number({ default: 409 }),
})

export const raceValidationErrorSchema = Type.Object({
  error: Type.String({ default: 'Bad Request' }),
  message: Type.String({ default: 'Validation failed' }),
  statusCode: Type.Number({ default: 400 }),
})

export const raceUnauthorizedErrorSchema = Type.Object({
  error: Type.String({ default: 'Unauthorized' }),
  message: Type.String({ default: 'Insufficient permissions' }),
  statusCode: Type.Number({ default: 401 }),
})

export const raceUsageConflictSchema = Type.Object({
  error: Type.String({ default: 'Conflict' }),
  message: Type.String({ default: 'Race is currently used by characters and cannot be deleted' }),
  statusCode: Type.Number({ default: 409 }),
})

// Route schemas for Fastify endpoints
export const createRaceRouteSchema = {
  description: 'Create a new race',
  tags: ['Races'],
  body: createRaceSchema,
  response: {
    201: raceSchema,
    400: raceValidationErrorSchema,
    401: raceUnauthorizedErrorSchema,
    409: raceConflictSchema,
  },
}

export const getRaceRouteSchema = {
  description: 'Get race by ID',
  tags: ['Races'],
  params: Type.Object({
    id: Type.String({ description: 'Race ID' }),
  }),
  response: {
    200: raceSchema,
    404: raceNotFoundSchema,
    401: raceUnauthorizedErrorSchema,
  },
}

export const updateRaceRouteSchema = {
  description: 'Update race by ID',
  tags: ['Races'],
  params: Type.Object({
    id: Type.String({ description: 'Race ID' }),
  }),
  body: updateRaceSchema,
  response: {
    200: raceSchema,
    400: raceValidationErrorSchema,
    404: raceNotFoundSchema,
    401: raceUnauthorizedErrorSchema,
    409: raceConflictSchema,
  },
}

export const deleteRaceRouteSchema = {
  description: 'Delete race by ID',
  tags: ['Races'],
  params: Type.Object({
    id: Type.String({ description: 'Race ID' }),
  }),
  response: {
    204: Type.Null(),
    404: raceNotFoundSchema,
    401: raceUnauthorizedErrorSchema,
    409: raceUsageConflictSchema,
  },
}

export const listRacesRouteSchema = {
  description: 'List races with pagination and filtering',
  tags: ['Races'],
  querystring: listRacesQuerySchema,
  response: {
    200: listRacesResponseSchema,
  },
}

export const raceStatsRouteSchema = {
  description: 'Get race statistics',
  tags: ['Races'],
  response: {
    200: raceStatsResponseSchema,
  },
}
