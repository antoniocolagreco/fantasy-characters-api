import { Type } from '@sinclair/typebox'

// Visibility enum values
const VISIBILITY_VALUES = ['PUBLIC', 'PRIVATE', 'HIDDEN'] as const

// Rarity enum values
const RARITY_VALUES = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const

// Slot enum values
const SLOT_VALUES = [
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
] as const

// Item schemas
export const itemSchema = Type.Object(
  {
    id: Type.String({ description: 'Unique item identifier' }),
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Item name (unique)',
      examples: ['Iron Sword', 'Leather Armor', 'Health Potion'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Optional item description',
        examples: ['A well-balanced sword made of iron', 'Light armor suitable for beginners'],
      }),
    ),

    // Attribute bonuses
    bonusHealth: Type.Optional(Type.Number({ description: 'Health bonus points' })),
    bonusMana: Type.Optional(Type.Number({ description: 'Mana bonus points' })),
    bonusStamina: Type.Optional(Type.Number({ description: 'Stamina bonus points' })),
    bonusStrength: Type.Optional(Type.Number({ description: 'Strength bonus points' })),
    bonusConstitution: Type.Optional(Type.Number({ description: 'Constitution bonus points' })),
    bonusDexterity: Type.Optional(Type.Number({ description: 'Dexterity bonus points' })),
    bonusIntelligence: Type.Optional(Type.Number({ description: 'Intelligence bonus points' })),
    bonusWisdom: Type.Optional(Type.Number({ description: 'Wisdom bonus points' })),
    bonusCharisma: Type.Optional(Type.Number({ description: 'Charisma bonus points' })),

    // Combat stats
    damage: Type.Optional(Type.Number({ minimum: 0, description: 'Damage points (for weapons)' })),
    defense: Type.Optional(Type.Number({ minimum: 0, description: 'Defense points (for armor)' })),

    // Item properties
    rarity: Type.String({
      enum: RARITY_VALUES,
      description: 'Item rarity level',
      default: 'COMMON',
    }),
    slot: Type.String({
      enum: SLOT_VALUES,
      description: 'Equipment slot the item can be equipped to',
      default: 'NONE',
    }),
    requiredLevel: Type.Number({
      minimum: 1,
      maximum: 100,
      default: 1,
      description: 'Minimum level required to use this item',
    }),
    weight: Type.Number({
      minimum: 0,
      default: 1.0,
      description: 'Item weight in kilograms',
    }),
    durability: Type.Number({
      minimum: 0,
      default: 100,
      description: 'Current durability points',
    }),
    maxDurability: Type.Number({
      minimum: 0,
      default: 100,
      description: 'Maximum durability points',
    }),
    value: Type.Number({
      minimum: 0,
      default: 0,
      description: 'Item value in gold pieces',
    }),

    // Item flags
    is2Handed: Type.Boolean({
      default: false,
      description: 'Whether the item requires both hands to use',
    }),
    isThrowable: Type.Boolean({
      default: false,
      description: 'Whether the item can be thrown',
    }),
    isConsumable: Type.Boolean({
      default: false,
      description: 'Whether the item is consumed when used',
    }),
    isQuestItem: Type.Boolean({
      default: false,
      description: 'Whether the item is a quest item',
    }),
    isTradeable: Type.Boolean({
      default: true,
      description: 'Whether the item can be traded',
    }),

    // Relationships
    imageId: Type.Optional(Type.String({ description: 'ID of the item image' })),
    ownerId: Type.Optional(Type.String({ description: 'ID of the user who created the item' })),
    visibility: Type.String({
      enum: VISIBILITY_VALUES,
      description: 'Item visibility level',
      default: 'PUBLIC',
    }),
    createdAt: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
    updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
  },
  { $id: 'Item' },
)

// Create item request schema
export const createItemSchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Item name (must be unique)',
      examples: ['Iron Sword', 'Leather Armor'],
    }),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Optional item description',
      }),
    ),

    // Attribute bonuses
    bonusHealth: Type.Optional(Type.Number({ description: 'Health bonus points' })),
    bonusMana: Type.Optional(Type.Number({ description: 'Mana bonus points' })),
    bonusStamina: Type.Optional(Type.Number({ description: 'Stamina bonus points' })),
    bonusStrength: Type.Optional(Type.Number({ description: 'Strength bonus points' })),
    bonusConstitution: Type.Optional(Type.Number({ description: 'Constitution bonus points' })),
    bonusDexterity: Type.Optional(Type.Number({ description: 'Dexterity bonus points' })),
    bonusIntelligence: Type.Optional(Type.Number({ description: 'Intelligence bonus points' })),
    bonusWisdom: Type.Optional(Type.Number({ description: 'Wisdom bonus points' })),
    bonusCharisma: Type.Optional(Type.Number({ description: 'Charisma bonus points' })),

    // Combat stats
    damage: Type.Optional(Type.Number({ minimum: 0, description: 'Damage points (for weapons)' })),
    defense: Type.Optional(Type.Number({ minimum: 0, description: 'Defense points (for armor)' })),

    // Item properties
    rarity: Type.Optional(
      Type.String({
        enum: RARITY_VALUES,
        description: 'Item rarity level',
        default: 'COMMON',
      }),
    ),
    slot: Type.Optional(
      Type.String({
        enum: SLOT_VALUES,
        description: 'Equipment slot the item can be equipped to',
        default: 'NONE',
      }),
    ),
    requiredLevel: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        default: 1,
        description: 'Minimum level required to use this item',
      }),
    ),
    weight: Type.Optional(
      Type.Number({
        minimum: 0,
        default: 1.0,
        description: 'Item weight in kilograms',
      }),
    ),
    durability: Type.Optional(
      Type.Number({
        minimum: 0,
        default: 100,
        description: 'Current durability points',
      }),
    ),
    maxDurability: Type.Optional(
      Type.Number({
        minimum: 0,
        default: 100,
        description: 'Maximum durability points',
      }),
    ),
    value: Type.Optional(
      Type.Number({
        minimum: 0,
        default: 0,
        description: 'Item value in gold pieces',
      }),
    ),

    // Item flags
    is2Handed: Type.Optional(
      Type.Boolean({
        default: false,
        description: 'Whether the item requires both hands to use',
      }),
    ),
    isThrowable: Type.Optional(
      Type.Boolean({
        default: false,
        description: 'Whether the item can be thrown',
      }),
    ),
    isConsumable: Type.Optional(
      Type.Boolean({
        default: false,
        description: 'Whether the item is consumed when used',
      }),
    ),
    isQuestItem: Type.Optional(
      Type.Boolean({
        default: false,
        description: 'Whether the item is a quest item',
      }),
    ),
    isTradeable: Type.Optional(
      Type.Boolean({
        default: true,
        description: 'Whether the item can be traded',
      }),
    ),

    // Relationships
    imageId: Type.Optional(
      Type.String({
        description: 'ID of the item image',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Item visibility level',
        default: 'PUBLIC',
      }),
    ),
  },
  { $id: 'CreateItem' },
)

// Update item request schema
export const updateItemSchema = Type.Object(
  {
    name: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Updated item name',
      }),
    ),
    description: Type.Optional(
      Type.String({
        maxLength: 1000,
        description: 'Updated item description',
      }),
    ),

    // Attribute bonuses
    bonusHealth: Type.Optional(Type.Number({ description: 'Updated health bonus points' })),
    bonusMana: Type.Optional(Type.Number({ description: 'Updated mana bonus points' })),
    bonusStamina: Type.Optional(Type.Number({ description: 'Updated stamina bonus points' })),
    bonusStrength: Type.Optional(Type.Number({ description: 'Updated strength bonus points' })),
    bonusConstitution: Type.Optional(
      Type.Number({ description: 'Updated constitution bonus points' }),
    ),
    bonusDexterity: Type.Optional(Type.Number({ description: 'Updated dexterity bonus points' })),
    bonusIntelligence: Type.Optional(
      Type.Number({ description: 'Updated intelligence bonus points' }),
    ),
    bonusWisdom: Type.Optional(Type.Number({ description: 'Updated wisdom bonus points' })),
    bonusCharisma: Type.Optional(Type.Number({ description: 'Updated charisma bonus points' })),

    // Combat stats
    damage: Type.Optional(Type.Number({ minimum: 0, description: 'Updated damage points' })),
    defense: Type.Optional(Type.Number({ minimum: 0, description: 'Updated defense points' })),

    // Item properties
    rarity: Type.Optional(
      Type.String({
        enum: RARITY_VALUES,
        description: 'Updated item rarity level',
      }),
    ),
    slot: Type.Optional(
      Type.String({
        enum: SLOT_VALUES,
        description: 'Updated equipment slot',
      }),
    ),
    requiredLevel: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        description: 'Updated minimum level required',
      }),
    ),
    weight: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Updated item weight',
      }),
    ),
    durability: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Updated current durability',
      }),
    ),
    maxDurability: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Updated maximum durability',
      }),
    ),
    value: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Updated item value',
      }),
    ),

    // Item flags
    is2Handed: Type.Optional(
      Type.Boolean({
        description: 'Updated two-handed flag',
      }),
    ),
    isThrowable: Type.Optional(
      Type.Boolean({
        description: 'Updated throwable flag',
      }),
    ),
    isConsumable: Type.Optional(
      Type.Boolean({
        description: 'Updated consumable flag',
      }),
    ),
    isQuestItem: Type.Optional(
      Type.Boolean({
        description: 'Updated quest item flag',
      }),
    ),
    isTradeable: Type.Optional(
      Type.Boolean({
        description: 'Updated tradeable flag',
      }),
    ),

    // Relationships
    imageId: Type.Optional(
      Type.String({
        description: 'Updated item image ID',
      }),
    ),
    visibility: Type.Optional(
      Type.String({
        enum: VISIBILITY_VALUES,
        description: 'Updated visibility level',
      }),
    ),
  },
  { $id: 'UpdateItem' },
)

// List items query schema
export const listItemsQuerySchema = Type.Object(
  {
    page: Type.Optional(Type.Number({ minimum: 1, default: 1, description: 'Page number' })),
    limit: Type.Optional(
      Type.Number({ minimum: 1, maximum: 100, default: 20, description: 'Items per page' }),
    ),
    rarity: Type.Optional(
      Type.String({
        enum: RARITY_VALUES,
        description: 'Filter by item rarity',
      }),
    ),
    slot: Type.Optional(
      Type.String({
        enum: SLOT_VALUES,
        description: 'Filter by equipment slot',
      }),
    ),
    minLevel: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        description: 'Filter by minimum required level',
      }),
    ),
    maxLevel: Type.Optional(
      Type.Number({
        minimum: 1,
        maximum: 100,
        description: 'Filter by maximum required level',
      }),
    ),
    minValue: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Filter by minimum value',
      }),
    ),
    maxValue: Type.Optional(
      Type.Number({
        minimum: 0,
        description: 'Filter by maximum value',
      }),
    ),
    isConsumable: Type.Optional(
      Type.Boolean({
        description: 'Filter by consumable items',
      }),
    ),
    isQuestItem: Type.Optional(
      Type.Boolean({
        description: 'Filter by quest items',
      }),
    ),
    isTradeable: Type.Optional(
      Type.Boolean({
        description: 'Filter by tradeable items',
      }),
    ),
    search: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 100,
        description: 'Search items by name or description',
      }),
    ),
  },
  { $id: 'ListItemsQuery' },
)

// List items response schema
export const listItemsResponseSchema = Type.Object(
  {
    data: Type.Array(itemSchema, { description: 'Array of items' }),
    pagination: Type.Object({
      page: Type.Number({ description: 'Current page number' }),
      limit: Type.Number({ description: 'Items per page' }),
      total: Type.Number({ description: 'Total number of items' }),
      totalPages: Type.Number({ description: 'Total number of pages' }),
    }),
  },
  { $id: 'ListItemsResponse' },
)

// Item statistics response schema
export const itemStatsResponseSchema = Type.Object(
  {
    totalItems: Type.Number({ description: 'Total number of items' }),
    publicItems: Type.Number({ description: 'Number of public items' }),
    privateItems: Type.Number({ description: 'Number of private items' }),
    orphanedItems: Type.Number({ description: 'Number of items with no owner' }),
    averageRequiredLevel: Type.Number({ description: 'Average required level across all items' }),
    averageValue: Type.Number({ description: 'Average value across all items' }),
    itemsByRarity: Type.Object({
      common: Type.Number({ description: 'Number of common items' }),
      uncommon: Type.Number({ description: 'Number of uncommon items' }),
      rare: Type.Number({ description: 'Number of rare items' }),
      epic: Type.Number({ description: 'Number of epic items' }),
      legendary: Type.Number({ description: 'Number of legendary items' }),
    }),
    itemsBySlot: Type.Object({
      none: Type.Number({ description: 'Items with no slot' }),
      head: Type.Number({ description: 'Head slot items' }),
      face: Type.Number({ description: 'Face slot items' }),
      chest: Type.Number({ description: 'Chest slot items' }),
      legs: Type.Number({ description: 'Legs slot items' }),
      feet: Type.Number({ description: 'Feet slot items' }),
      hands: Type.Number({ description: 'Hands slot items' }),
      oneHand: Type.Number({ description: 'One-hand slot items' }),
      twoHands: Type.Number({ description: 'Two-hands slot items' }),
      ring: Type.Number({ description: 'Ring slot items' }),
      amulet: Type.Number({ description: 'Amulet slot items' }),
      belt: Type.Number({ description: 'Belt slot items' }),
      backpack: Type.Number({ description: 'Backpack slot items' }),
      cloak: Type.Number({ description: 'Cloak slot items' }),
    }),
    itemsByType: Type.Object({
      weapons: Type.Number({ description: 'Weapon items (with damage)' }),
      armor: Type.Number({ description: 'Armor items (with defense)' }),
      accessories: Type.Number({ description: 'Accessory items (rings, amulets, etc.)' }),
      consumables: Type.Number({ description: 'Consumable items' }),
      questItems: Type.Number({ description: 'Quest items' }),
      miscellaneous: Type.Number({ description: 'Miscellaneous items' }),
    }),
  },
  { $id: 'ItemStatsResponse' },
)

// Error response schemas
export const itemNotFoundSchema = Type.Object({
  error: Type.String({ default: 'Not Found' }),
  message: Type.String({ default: 'Item not found' }),
  statusCode: Type.Number({ default: 404 }),
})

export const itemConflictSchema = Type.Object({
  error: Type.String({ default: 'Conflict' }),
  message: Type.String({ default: 'Item with this name already exists' }),
  statusCode: Type.Number({ default: 409 }),
})

export const itemValidationErrorSchema = Type.Object({
  error: Type.String({ default: 'Bad Request' }),
  message: Type.String({ default: 'Validation failed' }),
  statusCode: Type.Number({ default: 400 }),
})

export const itemUnauthorizedErrorSchema = Type.Object({
  error: Type.String({ default: 'Unauthorized' }),
  message: Type.String({ default: 'Insufficient permissions' }),
  statusCode: Type.Number({ default: 401 }),
})

// Route schemas for Fastify endpoints
export const createItemRouteSchema = {
  description: 'Create a new item',
  tags: ['Items'],
  body: createItemSchema,
  response: {
    201: itemSchema,
    400: itemValidationErrorSchema,
    401: itemUnauthorizedErrorSchema,
    409: itemConflictSchema,
  },
}

export const getItemRouteSchema = {
  description: 'Get item by ID',
  tags: ['Items'],
  params: Type.Object({
    id: Type.String({ description: 'Item ID' }),
  }),
  response: {
    200: itemSchema,
    404: itemNotFoundSchema,
    401: itemUnauthorizedErrorSchema,
  },
}

export const updateItemRouteSchema = {
  description: 'Update item by ID',
  tags: ['Items'],
  params: Type.Object({
    id: Type.String({ description: 'Item ID' }),
  }),
  body: updateItemSchema,
  response: {
    200: itemSchema,
    400: itemValidationErrorSchema,
    404: itemNotFoundSchema,
    401: itemUnauthorizedErrorSchema,
    409: itemConflictSchema,
  },
}

export const deleteItemRouteSchema = {
  description: 'Delete item by ID',
  tags: ['Items'],
  params: Type.Object({
    id: Type.String({ description: 'Item ID' }),
  }),
  response: {
    204: Type.Null(),
    404: itemNotFoundSchema,
    401: itemUnauthorizedErrorSchema,
  },
}

export const listItemsRouteSchema = {
  description: 'List items with pagination and filtering',
  tags: ['Items'],
  querystring: listItemsQuerySchema,
  response: {
    200: listItemsResponseSchema,
  },
}

export const itemStatsRouteSchema = {
  description: 'Get item statistics',
  tags: ['Items'],
  response: {
    200: itemStatsResponseSchema,
  },
}
